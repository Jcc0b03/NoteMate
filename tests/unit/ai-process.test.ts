import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    currentUser: vi.fn(), findUnique: vi.fn(), update: vi.fn(), generateObject: vi.fn(), read: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ currentUser: mocks.currentUser }));
vi.mock("@/lib/prisma", () => ({ prisma: { note: { findUnique: mocks.findUnique, update: mocks.update } } }));
vi.mock("@/lib/file-storage", () => ({ readStoredFileBytes: mocks.read }));
vi.mock("@ai-sdk/google", () => ({ google: vi.fn() }));
vi.mock("ai", () => ({ generateObject: mocks.generateObject, jsonSchema: vi.fn(value => value) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { POST } from "@/app/api/ai/process/route";

function request(body = JSON.stringify({ noteId: "note-1" })) {
    return new Request("http://localhost/api/ai/process", { method: "POST", body, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
    mocks.currentUser.mockResolvedValue({ id: "owner" });
    mocks.findUnique.mockResolvedValue({ id: "note-1", userId: "owner", files: [{ url: "file", name: "note.pdf", type: "application/pdf" }] });
    mocks.update.mockResolvedValue({});
    mocks.read.mockResolvedValue(Buffer.from("note"));
    mocks.generateObject.mockResolvedValue({ object: { summary: "summary", content: "content" } });
});

describe("AI processing authorization and status", () => {
    it("does not mutate another user's note after rejecting access", async () => {
        mocks.currentUser.mockResolvedValue({ id: "attacker" });
        const response = await POST(request());
        expect(response.status).toBe(403);
        expect(mocks.update).not.toHaveBeenCalled();
        expect(mocks.generateObject).not.toHaveBeenCalled();
    });

    it("does not mutate any note when it is missing", async () => {
        mocks.findUnique.mockResolvedValue(null);
        expect((await POST(request())).status).toBe(404);
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it("rejects unauthenticated requests before accessing notes", async () => {
        mocks.currentUser.mockResolvedValue(null);
        expect((await POST(request())).status).toBe(401);
        expect(mocks.findUnique).not.toHaveBeenCalled();
    });

    it.each(["{", "{}", '{"noteId":42}'])("rejects invalid request %s without writes", async body => {
        expect((await POST(request(body))).status).toBe(400);
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it("records FAILED once after an authorized provider failure", async () => {
        mocks.generateObject.mockRejectedValue(new Error("internal-provider-error"));
        const response = await POST(request());
        expect(response.status).toBe(500);
        expect(await response.text()).not.toContain("internal-provider-error");
        expect(mocks.update.mock.calls.map(([args]) => args.data.status)).toEqual(["PROCESSING", "FAILED"]);
    });

    it("persists an authorized successful result", async () => {
        expect((await POST(request())).status).toBe(200);
        expect(mocks.update).toHaveBeenLastCalledWith({ where: { id: "note-1" }, data: { summary: "summary", content: "content", status: "COMPLETED" } });
    });
});
