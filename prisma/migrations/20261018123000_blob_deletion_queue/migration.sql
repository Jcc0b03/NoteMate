CREATE TABLE "BlobDeletion" (
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlobDeletion_pkey" PRIMARY KEY ("url")
);
