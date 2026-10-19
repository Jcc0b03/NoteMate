import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ currentUser: vi.fn(), findUnique: vi.fn(), transaction: vi.fn(), copy: vi.fn(), del: vi.fn(), revalidate: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ currentUser: mocks.currentUser }));
vi.mock("@/lib/prisma", () => ({ prisma: { note: { findUnique: mocks.findUnique }, $transaction: mocks.transaction } }));
vi.mock("@/lib/file-storage", () => ({ copyPrivateFile: mocks.copy }));
vi.mock("@/lib/note-ai", () => ({ processNoteWithAi: vi.fn() }));
vi.mock("@/lib/ai-files", () => ({ deleteCachedAiFile: vi.fn() }));
vi.mock("@vercel/blob", () => ({ del: mocks.del }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/server", () => ({ after: vi.fn() }));
import { cloneNote } from "@/actions/note";

beforeEach(() => {
    mocks.currentUser.mockResolvedValue({ id: "owner" });
    mocks.findUnique.mockResolvedValue({ userId: "owner", isShared: false, sharedWith: [], files: [{ url: "source-1" }, { url: "source-2" }] });
    mocks.copy.mockImplementation(async (file: { url: string }) => ({ url: `copy-${file.url}` }));
    mocks.transaction.mockResolvedValue({ id: "clone" });
    mocks.del.mockResolvedValue(undefined);
    mocks.revalidate.mockImplementation(() => {});
});

describe("clone failure boundaries", () => {
    it("never copies files before authorization", async () => {
        mocks.currentUser.mockResolvedValue({ id: "attacker" });
        expect((await cloneNote("note")).success).toBe(false);
        expect(mocks.copy).not.toHaveBeenCalled();
    });
    it("only cleans up newly created objects after a partial copy failure", async () => {
        mocks.copy.mockResolvedValueOnce({ url: "new-copy" }).mockRejectedValueOnce(new Error("copy failed"));
        expect((await cloneNote("note")).success).toBe(false);
        expect(mocks.del.mock.calls).toEqual([["new-copy"]]);
    });
    it("cleans up copied files when the database transaction rejects", async () => {
        mocks.transaction.mockRejectedValue(new Error("database failed"));
        expect((await cloneNote("note")).success).toBe(false);
        expect(mocks.del.mock.calls).toEqual([["copy-source-1"], ["copy-source-2"]]);
    });
    it("keeps committed files when cache invalidation fails", async () => {
        mocks.revalidate.mockImplementation(() => { throw new Error("cache failed"); });
        expect(await cloneNote("note")).toEqual({ success: true, noteId: "clone" });
        expect(mocks.del).not.toHaveBeenCalled();
    });
});
