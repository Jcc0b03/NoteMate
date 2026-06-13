export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_UPLOAD_CONTENT_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
] as const;

export function getUploadValidationError(file: File) {
    if (!ALLOWED_UPLOAD_CONTENT_TYPES.includes(file.type as typeof ALLOWED_UPLOAD_CONTENT_TYPES[number])) {
        return "Unsupported file type. Upload JPG, PNG, GIF, or PDF files.";
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        return "File is too large. Maximum upload size is 10 MB.";
    }

    return null;
}

export function sanitizeUploadFilename(filename: string) {
    const safeName = filename
        .trim()
        .replace(/[\\/]+/g, "-")
        .replace(/[^\w.() -]+/g, "-")
        .replace(/\s+/g, " ")
        .slice(0, 120);

    return safeName || "upload";
}
