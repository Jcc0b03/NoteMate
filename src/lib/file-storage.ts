import { get, put, del } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http-error";
import { MAX_UPLOAD_SIZE_BYTES, getUploadValidationError, sanitizeUploadFilename } from "@/lib/upload-validation";

export function storagePath(userId: string, name: string) {
    return `users/${encodeURIComponent(userId)}/${randomUUID()}/${sanitizeUploadFilename(name)}`;
}

export function validateStorageUrl(value: string) {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash ||
        !/^[a-z0-9-]+\.(?:public|private)\.blob\.vercel-storage\.com$/.test(url.hostname)) {
        throw new HttpError(400, "Invalid storage URL");
    }
    return url;
}

export async function readStoredFile(url: string, signal = AbortSignal.timeout(15_000)) {
    const parsed = validateStorageUrl(url);
    // Existing public files remain readable during a separately managed migration.
    // Never send a storage token to public URLs or follow redirects with it.
    if (parsed.hostname.endsWith(".public.blob.vercel-storage.com")) {
        const response = await fetch(url, { signal, redirect: "error", cache: "no-store" });
        if (!response.ok) throw new HttpError(502, "Failed to read stored file");
        return response;
    }
    const blob = await get(url, { access: "private", abortSignal: signal, useCache: false });
    if (!blob || blob.statusCode !== 200) throw new HttpError(502, "Failed to read stored file");
    return new Response(blob.stream, { headers: { "Content-Type": blob.blob.contentType } });
}

export async function readStoredFileBytes(url: string, signal?: AbortSignal) {
    const response = await readStoredFile(url, signal);
    if (Number(response.headers.get("Content-Length")) > MAX_UPLOAD_SIZE_BYTES) {
        await response.body?.cancel();
        throw new HttpError(413, "Stored file is too large");
    }
    if (!response.body) throw new HttpError(502, "Empty stored file response");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > MAX_UPLOAD_SIZE_BYTES) {
                await reader.cancel();
                throw new HttpError(413, "Stored file is too large");
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }
    return Buffer.concat(chunks);
}

export async function uploadPrivateFile(file: File, userId: string, handoffId?: string) {
    const error = getUploadValidationError(file);
    if (error) throw new HttpError(400, error);
    const name = sanitizeUploadFilename(file.name);
    const blob = await put(storagePath(userId, name), file, {
        access: "private", contentType: file.type, addRandomSuffix: false,
        abortSignal: AbortSignal.timeout(15_000),
    });
    try {
        return await prisma.upload.create({ data: {
            userId, url: blob.url, pathname: blob.pathname, name, type: file.type, size: file.size, handoffId,
        } });
    } catch (error) {
        await del(blob.url).catch(() => console.error("Failed to clean up unregistered upload"));
        throw error;
    }
}

export async function copyPrivateFile(file: { url: string; name: string; type: string }, userId: string) {
    const bytes = await readStoredFileBytes(file.url);
    const blob = await put(storagePath(userId, file.name), bytes, {
        access: "private", contentType: file.type, addRandomSuffix: false,
        abortSignal: AbortSignal.timeout(15_000),
    });
    return { url: blob.url, pathname: blob.pathname, name: file.name, type: file.type, size: bytes.length };
}

export async function deleteUnclaimedUpload(url: string, userId: string) {
    const upload = await prisma.upload.findUnique({ where: { url } });
    if (!upload || upload.userId !== userId) throw new HttpError(403, "Forbidden");
    if (upload.claimedAt || await prisma.noteFile.count({ where: { url } })) {
        throw new HttpError(409, "File is attached to a note");
    }
    // The same atomic claim is used when attaching files to a note.
    const claimedAt = new Date();
    const lock = await prisma.upload.updateMany({ where: { id: upload.id, claimedAt: null }, data: { claimedAt } });
    if (lock.count !== 1) throw new HttpError(409, "Upload is already in use");
    try {
        await del(url);
        await prisma.upload.delete({ where: { id: upload.id } });
    } catch (error) {
        await prisma.upload.updateMany({ where: { id: upload.id, claimedAt }, data: { claimedAt: null } });
        throw error;
    }
}

export async function cleanupStoredFile(url: string) {
    try {
        const parsed = validateStorageUrl(url);
        if (await prisma.noteFile.count({ where: { url } }) || await prisma.note.count({ where: { imageUrl: url } })) return false;
        const upload = await prisma.upload.findUnique({ where: { url } });
        if (upload && !upload.claimedAt) return false;
        const token = parsed.hostname.endsWith(".public.blob.vercel-storage.com")
            ? process.env.LEGACY_BLOB_READ_WRITE_TOKEN
            : undefined;
        if (parsed.hostname.endsWith(".public.blob.vercel-storage.com") && !token) return false;
        await del(url, { ...(token ? { token } : {}), abortSignal: AbortSignal.timeout(15_000) });
        await prisma.blobDeletion.deleteMany({ where: { url } });
        return true;
    } catch {
        // The database queue survives a process crash or a storage outage.
        console.error("Stored file cleanup remains pending");
        return false;
    }
}
