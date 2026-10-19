import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    findUniqueOrThrow: vi.fn(), updateMany: vi.fn(), read: vi.fn(),
    uploadFile: vi.fn(), getFile: vi.fn(), deleteFile: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: { noteFile: { findUniqueOrThrow: mocks.findUniqueOrThrow, updateMany: mocks.updateMany } } }));
vi.mock("@/lib/file-storage", () => ({ readStoredFileBytes: mocks.read }));
vi.mock("@google/generative-ai/server", () => ({
    FileState: { ACTIVE: "ACTIVE", PROCESSING: "PROCESSING", FAILED: "FAILED" },
    GoogleAIFileManager: vi.fn(function () { return { uploadFile: mocks.uploadFile, getFile: mocks.getFile, deleteFile: mocks.deleteFile }; }),
}));

import { getAiFile, MAX_FILE_POLL_ATTEMPTS } from "@/lib/ai-files";

type Cache = { aiFileName: string | null; aiFileUri: string | null; aiFileMimeType: string | null; aiFileExpiresAt: Date | null; aiFileLeaseUntil: Date | null };
let cache: Cache;
const file = { id: "file-1", url: "stored-file", name: "note.pdf", type: "application/pdf" };
const remote = () => ({ name: "files/new", uri: "https://generativelanguage.googleapis.com/v1beta/files/new", mimeType: "application/pdf", expirationTime: new Date(Date.now() + 86_400_000).toISOString(), state: "ACTIVE" });

beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "unit-test-only");
    cache = { aiFileName: null, aiFileUri: null, aiFileMimeType: null, aiFileExpiresAt: null, aiFileLeaseUntil: null };
    mocks.findUniqueOrThrow.mockImplementation(async () => ({ ...cache }));
    mocks.updateMany.mockImplementation(async ({ data }: { data: Partial<Cache> }) => { Object.assign(cache, data); return { count: 1 }; });
    mocks.read.mockResolvedValue(Buffer.from("file"));
    mocks.uploadFile.mockImplementation(async () => ({ file: remote() }));
    mocks.getFile.mockImplementation(async () => remote());
    mocks.deleteFile.mockResolvedValue(undefined);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("persisted Google file cache", () => {
    it("reuses an unexpired database cache without downloading or uploading", async () => {
        cache = { ...cache, aiFileName: "files/cached", aiFileUri: "cached-uri", aiFileMimeType: "application/pdf", aiFileExpiresAt: new Date(Date.now() + 600_000) };
        expect(await getAiFile(file)).toEqual({ uri: "cached-uri", mimeType: "application/pdf" });
        expect(mocks.read).not.toHaveBeenCalled();
        expect(mocks.uploadFile).not.toHaveBeenCalled();
    });

    it("persists one upload and reuses it on the next independent request", async () => {
        const first = await getAiFile(file);
        const second = await getAiFile(file);
        expect(first).toEqual(second);
        expect(mocks.uploadFile).toHaveBeenCalledTimes(1);
        expect(mocks.uploadFile.mock.calls[0][0]).toBeInstanceOf(Buffer);
        expect(cache.aiFileLeaseUntil).toBeNull();
        expect(cache.aiFileName).toBe("files/new");
    });

    it("refreshes expired files and cleans up the old provider object", async () => {
        cache = { ...cache, aiFileName: "files/old", aiFileUri: "old", aiFileMimeType: "application/pdf", aiFileExpiresAt: new Date(Date.now() - 1) };
        expect((await getAiFile(file)).uri).toContain("files/new");
        expect(mocks.deleteFile).toHaveBeenCalledWith("files/old");
    });

    it("bounds polling and cleans up the provider file and lease on timeout", async () => {
        vi.useFakeTimers();
        mocks.uploadFile.mockResolvedValue({ file: { ...remote(), state: "PROCESSING" } });
        mocks.getFile.mockImplementation(async () => ({ ...remote(), state: "PROCESSING" }));
        const result = expect(getAiFile(file)).rejects.toMatchObject({ status: 504 });
        await vi.runAllTimersAsync();
        await result;
        expect(mocks.getFile).toHaveBeenCalledTimes(MAX_FILE_POLL_ATTEMPTS);
        expect(mocks.deleteFile).toHaveBeenCalledWith("files/new");
        expect(cache.aiFileUri).toBeNull();
        expect(cache.aiFileLeaseUntil).toBeNull();
    });

    it("rejects FAILED provider state instead of using an unusable URI", async () => {
        mocks.uploadFile.mockResolvedValue({ file: { ...remote(), state: "FAILED" } });
        await expect(getAiFile(file)).rejects.toMatchObject({ status: 502 });
        expect(mocks.deleteFile).toHaveBeenCalledWith("files/new");
        expect(cache.aiFileUri).toBeNull();
    });

    it("releases the lease when the upload itself rejects", async () => {
        mocks.uploadFile.mockRejectedValue(new Error("network failed"));
        await expect(getAiFile(file)).rejects.toThrow("network failed");
        expect(cache.aiFileLeaseUntil).toBeNull();
        expect(cache.aiFileUri).toBeNull();
    });

    it("bounds waiting for another worker's lease", async () => {
        vi.useFakeTimers();
        mocks.updateMany.mockResolvedValue({ count: 0 });
        const result = expect(getAiFile(file, Date.now() + 500)).rejects.toMatchObject({ status: 504 });
        await vi.runAllTimersAsync();
        await result;
        expect(mocks.read).not.toHaveBeenCalled();
    });
});
