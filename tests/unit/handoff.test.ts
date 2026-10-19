import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ currentUser: vi.fn(), findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), upload: vi.fn(), updateMany: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ currentUser: mocks.currentUser }));
vi.mock("@/lib/prisma", () => ({ prisma: { handoffSession: { findUnique: mocks.findUnique, create: mocks.create, updateMany: mocks.updateMany }, upload: { findMany: mocks.findMany } } }));
vi.mock("@/lib/file-storage", () => ({ uploadPrivateFile: mocks.upload }));

import { GET as poll } from "@/app/api/handoff/poll/route";
import { POST as upload } from "@/app/api/handoff/upload/route";
import { POST as createSession } from "@/app/api/handoff/session/route";
import { POST as complete } from "@/app/api/handoff/complete/route";

const id = "123e4567-e89b-42d3-a456-426614174000";
const session = () => ({ id, userId: "owner", expiresAt: new Date(Date.now() + 60_000), completedAt: null });
function request(method = "GET", token = id) {
    const body = new FormData();
    body.append("file", new File(["file"], "note.pdf", { type: "application/pdf" }));
    return new Request(`http://localhost/api/handoff/upload?sessionId=${token}`, { method, ...(method === "POST" ? { body } : {}) });
}

beforeEach(() => {
    mocks.currentUser.mockResolvedValue({ id: "owner" });
    mocks.findUnique.mockImplementation(async () => session());
    mocks.create.mockImplementation(async () => session());
    mocks.findMany.mockResolvedValue([]);
    mocks.upload.mockResolvedValue({ url: "private-url", name: "note.pdf", size: 4 });
    mocks.updateMany.mockResolvedValue({ count: 1 });
});

describe("server-issued handoff sessions", () => {
    it("requires authentication to create a session", async () => {
        mocks.currentUser.mockResolvedValue(null);
        expect((await createSession()).status).toBe(401);
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it("binds a server-created expiring session to the authenticated owner", async () => {
        expect((await createSession()).status).toBe(200);
        expect(mocks.create).toHaveBeenCalledWith({ data: { userId: "owner", expiresAt: expect.any(Date) } });
    });

    it("rejects arbitrary client-generated tokens not present in the database", async () => {
        mocks.findUnique.mockResolvedValue(null);
        expect((await upload(request("POST"))).status).toBe(404);
        expect(mocks.upload).not.toHaveBeenCalled();
    });

    it("rejects expired and completed sessions before writing storage", async () => {
        mocks.findUnique.mockResolvedValue({ ...session(), expiresAt: new Date(0) });
        expect((await upload(request("POST"))).status).toBe(410);
        mocks.findUnique.mockResolvedValue({ ...session(), completedAt: new Date() });
        expect((await upload(request("POST"))).status).toBe(409);
        expect(mocks.upload).not.toHaveBeenCalled();
    });

    it("lets the phone upload only into the session owner's private registry", async () => {
        mocks.currentUser.mockResolvedValue(null);
        const response = await upload(request("POST"));
        expect(response.status).toBe(200);
        expect(mocks.upload).toHaveBeenCalledWith(expect.any(File), "owner", id);
        expect(await response.json()).not.toHaveProperty("url");
    });

    it("does not let another user list files even with the QR token", async () => {
        mocks.currentUser.mockResolvedValue({ id: "attacker" });
        expect((await poll(request())).status).toBe(403);
        expect(mocks.findMany).not.toHaveBeenCalled();
    });

    it("does not let an anonymous phone list files", async () => {
        mocks.currentUser.mockResolvedValue(null);
        expect((await poll(request())).status).toBe(401);
        expect(mocks.findMany).not.toHaveBeenCalled();
    });

    it("only completes an active session and does not publish marker blobs", async () => {
        expect((await complete(request("POST"))).status).toBe(200);
        expect(mocks.updateMany).toHaveBeenCalledWith({ where: { id, completedAt: null }, data: { completedAt: expect.any(Date) } });
    });
});
