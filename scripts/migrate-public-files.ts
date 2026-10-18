import { config } from "dotenv";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
    const { prisma } = await import("../src/lib/prisma");
    const { copyPrivateFile, validateStorageUrl } = await import("../src/lib/file-storage");
    const { deleteCachedAiFile } = await import("../src/lib/ai-files");
    const { del } = await import("@vercel/blob");
    const apply = process.argv.includes("--apply");
    const directory = path.resolve(".local-migrations");
    const manifest = path.join(directory, "pending-public-blobs.json");
    const pending = new Set<string>();
    async function savePending() {
        await mkdir(directory, { recursive: true, mode: 0o700 });
        const temp = `${manifest}.${randomUUID()}.tmp`;
        await writeFile(temp, JSON.stringify({ version: 1, urls: [...pending] }, null, 2), { mode: 0o600 });
        await rename(temp, manifest);
    }
    try {
        try {
            const saved: unknown = JSON.parse(await readFile(manifest, "utf8"));
            if (typeof saved !== "object" || saved === null || !("version" in saved) || saved.version !== 1 ||
                !("urls" in saved) || !Array.isArray(saved.urls) || !saved.urls.every(url => typeof url === "string")) {
                throw new Error("Unrecognized migration manifest; refusing to overwrite it");
            }
            for (const url of saved.urls) pending.add(url);
        } catch (error) {
            if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
        }
        const files = await prisma.noteFile.findMany({
            where: { url: { contains: ".public.blob.vercel-storage.com/" } },
            include: { note: { select: { userId: true } } },
        });
        const queued = await prisma.blobDeletion.findMany({ where: { url: { contains: ".public.blob.vercel-storage.com/" } } });
        for (const job of queued) pending.add(job.url);
        console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", filesToCopy: files.length, pendingPublicDeletions: pending.size }));
        if (!apply) return;
        if (!process.env.BLOB_READ_WRITE_TOKEN || !process.env.LEGACY_BLOB_READ_WRITE_TOKEN) {
            throw new Error("Set BLOB_READ_WRITE_TOKEN for the private store and LEGACY_BLOB_READ_WRITE_TOKEN for the old public store securely before applying");
        }
        for (const file of files) pending.add(file.url);
        // Persist retirement candidates before changing database references.
        await savePending();
        for (const file of files) {
            const parsed = validateStorageUrl(file.url);
            if (!parsed.hostname.endsWith(".public.blob.vercel-storage.com")) throw new Error("Expected a public source blob");
            const copy = await copyPrivateFile(file, file.note.userId);
            let committed = false;
            try {
                await prisma.$transaction(async tx => {
                    await tx.upload.create({ data: { ...copy, userId: file.note.userId, claimedAt: new Date() } });
                    await tx.noteFile.update({ where: { id: file.id, url: file.url }, data: {
                        url: copy.url, size: copy.size,
                        aiFileName: null, aiFileUri: null, aiFileMimeType: null, aiFileExpiresAt: null, aiFileLeaseUntil: null,
                    } });
                    await tx.note.updateMany({ where: { id: file.noteId, imageUrl: file.url }, data: { imageUrl: copy.url } });
                });
                committed = true;
                if (file.aiFileName) await deleteCachedAiFile(file.aiFileName);
            } finally {
                if (!committed) await del(copy.url);
            }
        }
        for (const url of [...pending]) {
            if (!validateStorageUrl(url).hostname.endsWith(".public.blob.vercel-storage.com")) throw new Error("Invalid public retirement candidate");
            const references = await prisma.noteFile.count({ where: { url } });
            const previews = await prisma.note.count({ where: { imageUrl: url } });
            if (references || previews) continue;
            await del(url, { token: process.env.LEGACY_BLOB_READ_WRITE_TOKEN });
            await prisma.blobDeletion.deleteMany({ where: { url } });
            pending.delete(url);
            await savePending();
        }
        console.log(JSON.stringify({ migratedFiles: files.length, pendingPublicDeletions: pending.size }));
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : "Public-file migration failed");
    process.exitCode = 1;
});
