import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { prisma } from "@/lib/prisma";
import { readStoredFileBytes } from "@/lib/file-storage";
import { HttpError } from "@/lib/http-error";

export const FILE_PREPARATION_TIMEOUT_MS = 35_000;
export const MAX_FILE_POLL_ATTEMPTS = 20;
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function remaining(deadline: number) {
    const ms = deadline - Date.now();
    if (ms <= 0) throw new HttpError(504, "AI file preparation timed out");
    return Math.min(ms, 10_000);
}

export async function deleteCachedAiFile(name: string) {
    if (!process.env.GEMINI_API_KEY) return;
    await new GoogleAIFileManager(process.env.GEMINI_API_KEY, { timeout: 5_000 })
        .deleteFile(name).catch(() => console.error("Google file cleanup failed"));
}

export async function getAiFile(file: { id: string; url: string; type: string; name: string }, deadline = Date.now() + FILE_PREPARATION_TIMEOUT_MS) {
    while (true) {
        remaining(deadline);
        const cached = await prisma.noteFile.findUniqueOrThrow({ where: { id: file.id } });
        if (cached.aiFileUri && cached.aiFileMimeType && cached.aiFileExpiresAt &&
            cached.aiFileExpiresAt.getTime() > Date.now() + 60_000) {
            return { uri: cached.aiFileUri, mimeType: cached.aiFileMimeType };
        }

        // Persist the lease so concurrent server instances do not both upload.
        const leaseUntil = new Date(Date.now() + FILE_PREPARATION_TIMEOUT_MS + 5_000);
        const lease = await prisma.noteFile.updateMany({
            where: { id: file.id, OR: [{ aiFileLeaseUntil: null }, { aiFileLeaseUntil: { lt: new Date() } }] },
            data: { aiFileLeaseUntil: leaseUntil },
        });
        if (lease.count !== 1) {
            await pause(Math.min(250, remaining(deadline)));
            continue;
        }

        let uploadedName: string | undefined;
        try {
            const fresh = await prisma.noteFile.findUniqueOrThrow({ where: { id: file.id } });
            if (fresh.aiFileUri && fresh.aiFileMimeType && fresh.aiFileExpiresAt && fresh.aiFileExpiresAt.getTime() > Date.now() + 60_000) {
                return { uri: fresh.aiFileUri, mimeType: fresh.aiFileMimeType };
            }
            if (!process.env.GEMINI_API_KEY) throw new HttpError(503, "AI file service is not configured");
            const bytes = await readStoredFileBytes(file.url, AbortSignal.timeout(remaining(deadline)));
            const manager = new GoogleAIFileManager(process.env.GEMINI_API_KEY, { timeout: remaining(deadline) });
            // The SDK accepts Buffer: there are no temporary disk files to leak.
            let remote = (await manager.uploadFile(bytes, { mimeType: file.type, displayName: file.name })).file;
            uploadedName = remote.name;
            let attempts = 0;
            while (remote.state === FileState.PROCESSING) {
                if (attempts++ >= MAX_FILE_POLL_ATTEMPTS) throw new HttpError(504, "AI file processing timed out");
                await pause(Math.min(1_000, remaining(deadline)));
                remote = await manager.getFile(remote.name, { timeout: remaining(deadline) });
            }
            if (remote.state !== FileState.ACTIVE) throw new HttpError(502, "AI file processing failed");
            const expiresAt = new Date(remote.expirationTime);
            if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now() + 60_000) {
                throw new HttpError(502, "Invalid AI file expiration");
            }
            const saved = await prisma.noteFile.updateMany({
                where: { id: file.id, aiFileLeaseUntil: leaseUntil },
                data: { aiFileName: remote.name, aiFileUri: remote.uri, aiFileMimeType: remote.mimeType || file.type, aiFileExpiresAt: expiresAt },
            });
            if (saved.count !== 1) throw new HttpError(409, "AI upload lease expired");
            uploadedName = undefined;
            if (cached.aiFileName && cached.aiFileName !== remote.name) await deleteCachedAiFile(cached.aiFileName);
            return { uri: remote.uri, mimeType: remote.mimeType || file.type };
        } catch (error) {
            if (uploadedName) await deleteCachedAiFile(uploadedName);
            throw error;
        } finally {
            await prisma.noteFile.updateMany({
                where: { id: file.id, aiFileLeaseUntil: leaseUntil }, data: { aiFileLeaseUntil: null },
            }).catch(() => console.error("AI upload lease release failed"));
        }
    }
}
