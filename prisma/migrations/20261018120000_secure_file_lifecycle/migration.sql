-- Also repair the sharing fields missing from the original migration history.
-- IF NOT EXISTS supports development databases previously aligned to schema.prisma.
ALTER TABLE "Note"
  ADD COLUMN IF NOT EXISTS "isShared" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "shareToken" TEXT,
  ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isPublicEditable" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS "Note_shareToken_key" ON "Note"("shareToken");

ALTER TABLE "NoteFile"
  ADD COLUMN "aiFileName" TEXT,
  ADD COLUMN "aiFileUri" TEXT,
  ADD COLUMN "aiFileMimeType" TEXT,
  ADD COLUMN "aiFileExpiresAt" TIMESTAMP(3),
  ADD COLUMN "aiFileLeaseUntil" TIMESTAMP(3);
CREATE INDEX "NoteFile_url_idx" ON "NoteFile"("url");

CREATE TABLE "HandoffSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "HandoffSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Upload" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "pathname" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "claimedAt" TIMESTAMP(3),
  "handoffId" TEXT,
  CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Upload_url_key" ON "Upload"("url");
CREATE INDEX "Upload_userId_claimedAt_idx" ON "Upload"("userId", "claimedAt");
CREATE INDEX "Upload_handoffId_idx" ON "Upload"("handoffId");
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_handoffId_fkey"
  FOREIGN KEY ("handoffId") REFERENCES "HandoffSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
