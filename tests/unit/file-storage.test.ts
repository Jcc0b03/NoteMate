import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/upload-validation";

const mocks = vi.hoisted(() => ({
    get: vi.fn(), put: vi.fn(), del: vi.fn(),
    upload: { create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn(), delete: vi.fn() }, count: vi.fn(),
}));
vi.mock("@vercel/blob", () => ({ get: mocks.get, put: mocks.put, del: mocks.del }));
vi.mock("@/lib/prisma", () => ({ prisma: { upload: mocks.upload, noteFile: { count: mocks.count } } }));

import { uploadPrivateFile, deleteUnclaimedUpload, readStoredFileBytes, validateStorageUrl } from "@/lib/file-storage";
const url = "https://store.private.blob.vercel-storage.com/note.pdf";

beforeEach(() => {
    mocks.put.mockResolvedValue({ url, pathname: "path" });
    mocks.upload.create.mockImplementation(async ({ data }) => ({ id: "upload", ...data }));
    mocks.upload.findUnique.mockResolvedValue({ id: "upload", userId: "owner", claimedAt: null });
    mocks.upload.updateMany.mockResolvedValue({ count: 1 });
    mocks.upload.delete.mockResolvedValue({});
    mocks.del.mockResolvedValue(undefined);
    mocks.count.mockResolvedValue(0);
    mocks.get.mockImplementation(async () => ({ statusCode: 200, stream: new Response("file").body, blob: { contentType: "application/pdf" } }));
});

describe("private uploads", () => {
    it("uses private access and persists canonical ownership and metadata", async () => {
        const result = await uploadPrivateFile(new File(["file"], "note.pdf", { type: "application/pdf" }), "owner");
        expect(mocks.put).toHaveBeenCalledWith(expect.stringMatching(/^users\/owner\/[^/]+\/note.pdf$/), expect.any(File), expect.objectContaining({ access: "private", contentType: "application/pdf" }));
        expect(result).toMatchObject({ userId: "owner", url, type: "application/pdf", size: 4 });
    });

    it("cleans up storage when upload registration fails", async () => {
        mocks.upload.create.mockRejectedValue(new Error("database failed"));
        await expect(uploadPrivateFile(new File(["file"], "note.pdf", { type: "application/pdf" }), "owner")).rejects.toThrow();
        expect(mocks.del).toHaveBeenCalledWith(url);
    });

    it("rejects unsupported MIME types before writing storage", async () => {
        await expect(uploadPrivateFile(new File(["<script>"], "attack.html", { type: "text/html" }), "owner")).rejects.toMatchObject({ status: 400 });
        expect(mocks.put).not.toHaveBeenCalled();
    });

    it("rejects oversized uploads before writing storage", async () => {
        await expect(uploadPrivateFile(new File([new Uint8Array(MAX_UPLOAD_SIZE_BYTES + 1)], "big.pdf", { type: "application/pdf" }), "owner")).rejects.toMatchObject({ status: 400 });
        expect(mocks.put).not.toHaveBeenCalled();
    });
});

describe("safe storage reads", () => {
    it.each(["http://127.0.0.1/", "https://evil.example/file", "https://store.private.blob.vercel-storage.com.evil.example/file", "https://user:pass@store.private.blob.vercel-storage.com/file", `${url}?redirect=1`])("rejects untrusted URL %s", value => {
        expect(() => validateStorageUrl(value)).toThrow();
    });

    it("reads private files via the authenticated SDK", async () => {
        expect((await readStoredFileBytes(url)).toString()).toBe("file");
        expect(mocks.get).toHaveBeenCalledWith(url, expect.objectContaining({ access: "private", useCache: false }));
    });

    it("stops a streaming response once it exceeds the size limit", async () => {
        mocks.get.mockResolvedValue({ statusCode: 200, stream: new Response(new Uint8Array(MAX_UPLOAD_SIZE_BYTES + 1)).body, blob: { contentType: "application/pdf" } });
        await expect(readStoredFileBytes(url)).rejects.toMatchObject({ status: 413 });
    });
});

describe("staged-upload deletion", () => {
    it("does not delete another user's upload", async () => {
        await expect(deleteUnclaimedUpload(url, "attacker")).rejects.toMatchObject({ status: 403 });
        expect(mocks.del).not.toHaveBeenCalled();
    });

    it("does not delete an attached asset", async () => {
        mocks.upload.findUnique.mockResolvedValue({ id: "upload", userId: "owner", claimedAt: new Date() });
        await expect(deleteUnclaimedUpload(url, "owner")).rejects.toMatchObject({ status: 409 });
        expect(mocks.del).not.toHaveBeenCalled();
    });

    it("does not delete a legacy shared reference", async () => {
        mocks.count.mockResolvedValue(1);
        await expect(deleteUnclaimedUpload(url, "owner")).rejects.toMatchObject({ status: 409 });
        expect(mocks.del).not.toHaveBeenCalled();
    });

    it("stops when a concurrent attachment wins the claim", async () => {
        mocks.upload.updateMany.mockResolvedValue({ count: 0 });
        await expect(deleteUnclaimedUpload(url, "owner")).rejects.toMatchObject({ status: 409 });
        expect(mocks.del).not.toHaveBeenCalled();
    });

    it("releases the claim after a storage failure so deletion can be retried", async () => {
        mocks.del.mockRejectedValue(new Error("offline"));
        await expect(deleteUnclaimedUpload(url, "owner")).rejects.toThrow("offline");
        expect(mocks.upload.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({ data: { claimedAt: null } }));
    });
});
