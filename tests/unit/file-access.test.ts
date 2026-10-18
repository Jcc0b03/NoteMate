import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ currentUser: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), read: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ currentUser: mocks.currentUser }));
vi.mock("@/lib/prisma", () => ({ prisma: { noteFile: { findUnique: mocks.findUnique, findFirst: mocks.findFirst } } }));
vi.mock("@/lib/file-storage", () => ({ readStoredFile: mocks.read }));
import { GET } from "@/app/api/file/route";

const request = () => new NextRequest("http://localhost/api/file?fileId=file-1");
const file = () => ({ id: "file-1", url: "private-url", name: "note.pdf", type: "application/pdf", note: { userId: "owner", isShared: false, sharedWith: [] } });
beforeEach(() => {
    mocks.currentUser.mockResolvedValue({ id: "owner" });
    mocks.findUnique.mockResolvedValue(file());
    mocks.findFirst.mockResolvedValue(file());
    mocks.read.mockImplementation(async () => new Response("file"));
});

describe("private file delivery", () => {
    it("rejects anonymous access before fetching storage", async () => {
        mocks.currentUser.mockResolvedValue(null);
        expect((await GET(request())).status).toBe(401);
        expect(mocks.read).not.toHaveBeenCalled();
    });
    it("rejects another user's unshared note before fetching storage", async () => {
        mocks.currentUser.mockResolvedValue({ id: "attacker" });
        expect((await GET(request())).status).toBe(403);
        expect(mocks.read).not.toHaveBeenCalled();
    });
    it("serves authorized bytes without reusable cache or content sniffing", async () => {
        const response = await GET(request());
        expect(response.status).toBe(200);
        expect(await response.text()).toBe("file");
        expect(response.headers.get("Cache-Control")).toBe("private, no-store");
        expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });
    it("forces legacy unsafe MIME types to download", async () => {
        mocks.findUnique.mockResolvedValue({ ...file(), type: "text/html" });
        const response = await GET(request());
        expect(response.headers.get("Content-Type")).toBe("application/octet-stream");
        expect(response.headers.get("Content-Disposition")).toMatch(/^attachment;/);
    });
    it("serves thumbnails through the same authorized private proxy", async () => {
        expect((await GET(new NextRequest("http://localhost/api/file?noteId=note-1"))).status).toBe(200);
        expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { noteId: "note-1", type: { startsWith: "image/" } } }));
    });
    it("does not expose another user's private thumbnail", async () => {
        mocks.currentUser.mockResolvedValue({ id: "attacker" });
        expect((await GET(new NextRequest("http://localhost/api/file?noteId=note-1"))).status).toBe(403);
        expect(mocks.read).not.toHaveBeenCalled();
    });
});
