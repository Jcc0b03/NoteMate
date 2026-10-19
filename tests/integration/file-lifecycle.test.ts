import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

const state = vi.hoisted(() => ({ userId: "", blobs: new Map<string, Buffer>(), uploadGoogle: vi.fn(), deleteBlob: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ currentUser: vi.fn(async () => ({ id: state.userId })) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@vercel/blob", () => ({
    put: vi.fn(async (pathname: string, body: File | Buffer) => {
        const url = `https://store.private.blob.vercel-storage.com/${pathname}`;
        state.blobs.set(url, Buffer.isBuffer(body) ? body : Buffer.from(await body.arrayBuffer()));
        return { url, pathname };
    }),
    get: vi.fn(async (url: string) => {
        const bytes = state.blobs.get(url);
        return bytes ? { statusCode: 200, stream: new Response(Uint8Array.from(bytes)).body, blob: { contentType: "application/pdf" } } : null;
    }),
    del: state.deleteBlob,
}));
vi.mock("@google/generative-ai/server", () => ({
    FileState: { ACTIVE: "ACTIVE", PROCESSING: "PROCESSING" },
    GoogleAIFileManager: vi.fn(function () { return { uploadFile: state.uploadGoogle, deleteFile: vi.fn(async () => {}) }; }),
}));

import { prisma } from "@/lib/prisma";
import { createNote, addNoteFiles, cloneNote, deleteNote } from "@/actions/note";
import { uploadPrivateFile, deleteUnclaimedUpload, readStoredFileBytes, cleanupStoredFile } from "@/lib/file-storage";
import { getAiFile } from "@/lib/ai-files";

let actors: string[];
function actor() {
    const id = `security-test-${randomUUID()}`;
    actors.push(id);
    state.userId = id;
    return id;
}
async function upload() {
    return uploadPrivateFile(new File(["private note"], "note.pdf", { type: "application/pdf" }), state.userId);
}
async function note() {
    const file = await upload();
    const result = await createNote({ title: "test note", subjectName: "", tags: [], files: [file] });
    return { ...result, file };
}

beforeEach(() => {
    actors = [];
    actor();
    vi.stubEnv("GEMINI_API_KEY", "integration-test-only");
    state.blobs.clear();
    state.deleteBlob.mockImplementation(async (url: string) => { state.blobs.delete(url); });
    state.uploadGoogle.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 25));
        return { file: { name: "files/cached", uri: "https://generativelanguage.googleapis.com/v1beta/files/cached", state: "ACTIVE", mimeType: "application/pdf", expirationTime: new Date(Date.now() + 86_400_000).toISOString() } };
    });
});
afterEach(async () => {
    await prisma.note.deleteMany({ where: { userId: { in: actors } } });
    await prisma.upload.deleteMany({ where: { userId: { in: actors } } });
    await prisma.handoffSession.deleteMany({ where: { userId: { in: actors } } });
    await prisma.subject.deleteMany({ where: { userId: { in: actors } } });
    await prisma.blobDeletion.deleteMany({ where: { OR: actors.map(userId => ({ url: { contains: userId } })) } });
    vi.unstubAllEnvs();
});
afterAll(async () => { await prisma.$disconnect(); });

describe("file lifecycle with real PostgreSQL and mocked external storage", () => {
    it("clones private bytes independently and keeps the clone after deleting the source", async () => {
        const owner = state.userId;
        const original = await note();
        await prisma.note.update({ where: { id: original.noteId }, data: { isShared: true } });
        actor();
        const clone = await cloneNote(original.noteId);
        expect(clone.success).toBe(true);
        const copied = await prisma.note.findUniqueOrThrow({ where: { id: clone.noteId }, include: { files: true } });
        expect(copied.files[0].url).not.toBe(original.file.url);
        expect((await readStoredFileBytes(copied.files[0].url)).toString()).toBe("private note");
        state.userId = owner;
        expect((await deleteNote(original.noteId)).success).toBe(true);
        expect(state.blobs.has(original.file.url)).toBe(false);
        expect(state.blobs.has(copied.files[0].url)).toBe(true);
        expect(await prisma.note.count({ where: { id: copied.id } })).toBe(1);
    });

    it("preserves blobs referenced by legacy clones until the last note is deleted", async () => {
        const owner = state.userId;
        const original = await note();
        const other = actor();
        const legacy = await prisma.note.create({ data: {
            userId: other, tags: [], sharedWith: [], files: { create: { url: original.file.url, name: "legacy.pdf", type: "application/pdf", size: 12 } },
        } });
        state.userId = owner;
        expect((await deleteNote(original.noteId)).success).toBe(true);
        expect(state.deleteBlob).not.toHaveBeenCalled();
        expect(state.blobs.has(original.file.url)).toBe(true);
        state.userId = other;
        expect((await deleteNote(legacy.id)).success).toBe(true);
        expect(state.blobs.has(original.file.url)).toBe(false);
    });

    it("rejects attaching or deleting another user's staged upload", async () => {
        const file = await upload();
        actor();
        await expect(createNote({ title: "attack", subjectName: "", tags: [], files: [file] })).rejects.toMatchObject({ status: 403 });
        await expect(deleteUnclaimedUpload(file.url, state.userId)).rejects.toMatchObject({ status: 403 });
        expect(await prisma.note.count({ where: { userId: state.userId } })).toBe(0);
        expect(state.blobs.has(file.url)).toBe(true);
    });

    it("atomically lets only one concurrent note consume a staged upload", async () => {
        const file = await upload();
        const data = { title: "race", subjectName: "", tags: [], files: [file] };
        const results = await Promise.allSettled([createNote(data), createNote(data)]);
        expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
        expect(results.filter(result => result.status === "rejected")).toHaveLength(1);
        expect(await prisma.noteFile.count({ where: { url: file.url } })).toBe(1);
    });

    it("uses registered metadata instead of forged client MIME, filename and size", async () => {
        const file = await upload();
        const result = await createNote({ title: "metadata", subjectName: "", tags: [], files: [{ ...file, type: "text/html", name: "attack.html", size: 0 }] });
        const stored = await prisma.noteFile.findFirstOrThrow({ where: { noteId: result.noteId } });
        expect(stored).toMatchObject({ type: "application/pdf", name: "note.pdf", size: 12 });
    });

    it("does not mutate a foreign note or consume the attacker's upload", async () => {
        const original = await note();
        await prisma.note.update({ where: { id: original.noteId }, data: { status: "COMPLETED" } });
        actor();
        const staged = await upload();
        expect((await addNoteFiles(original.noteId, [staged])).success).toBe(false);
        expect((await deleteNote(original.noteId)).success).toBe(false);
        expect((await prisma.note.findUniqueOrThrow({ where: { id: original.noteId } })).status).toBe("COMPLETED");
        expect((await prisma.upload.findUniqueOrThrow({ where: { url: staged.url } })).claimedAt).toBeNull();
    });

    it("does not clone a private note without access", async () => {
        const original = await note();
        actor();
        expect((await cloneNote(original.noteId)).success).toBe(false);
        expect(state.blobs.size).toBe(1);
    });

    it("shares one durable AI upload across concurrent workers and later requests", async () => {
        const original = await note();
        const file = await prisma.noteFile.findFirstOrThrow({ where: { noteId: original.noteId } });
        const [first, second] = await Promise.all([getAiFile(file), getAiFile(file)]);
        expect(first).toEqual(second);
        expect(await getAiFile(file)).toEqual(first);
        expect(state.uploadGoogle).toHaveBeenCalledTimes(1);
        const stored = await prisma.noteFile.findUniqueOrThrow({ where: { id: file.id } });
        expect(stored.aiFileUri).toBe(first.uri);
        expect(stored.aiFileLeaseUntil).toBeNull();
    });

    it("persists failed blob deletions and safely retries them after an outage", async () => {
        const original = await note();
        state.deleteBlob.mockRejectedValueOnce(new Error("storage offline"));
        expect(await deleteNote(original.noteId)).toMatchObject({ success: true, cleanupPending: true });
        expect(await prisma.blobDeletion.count({ where: { url: original.file.url } })).toBe(1);
        expect(await cleanupStoredFile(original.file.url)).toBe(true);
        expect(await prisma.blobDeletion.count({ where: { url: original.file.url } })).toBe(0);
        expect(state.blobs.has(original.file.url)).toBe(false);
    });
});
