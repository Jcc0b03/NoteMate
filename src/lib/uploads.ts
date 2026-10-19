import type { Prisma } from "../../generated/prisma/client";
import { HttpError } from "@/lib/http-error";

export async function claimUploads(tx: Prisma.TransactionClient, urls: string[], userId: string) {
    if (!urls.length || urls.some(url => typeof url !== "string") || new Set(urls).size !== urls.length) {
        throw new HttpError(400, "Provide distinct uploaded files");
    }
    const uploads = await tx.upload.findMany({ where: { url: { in: urls }, userId, claimedAt: null } });
    if (uploads.length !== urls.length) throw new HttpError(403, "Upload is not available to this user");
    const claimed = await tx.upload.updateMany({
        where: { id: { in: uploads.map(file => file.id) }, userId, claimedAt: null },
        data: { claimedAt: new Date() },
    });
    if (claimed.count !== uploads.length) throw new HttpError(409, "Upload is already in use");
    return urls.map(url => uploads.find(file => file.url === url)!);
}
