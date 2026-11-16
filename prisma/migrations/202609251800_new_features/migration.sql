-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CONTRACTOR';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "OrgMemberRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "orgRole" "OrgMemberRole" DEFAULT 'OWNER';

-- AlterTable offers
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- CreateTable offer_attachments
CREATE TABLE IF NOT EXISTS "offer_attachments" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "offer_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable notifications
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable organization_invitations
CREATE TABLE IF NOT EXISTS "organization_invitations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "OrgMemberRole" NOT NULL DEFAULT 'EDITOR',
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable deadline_reminders
CREATE TABLE IF NOT EXISTS "deadline_reminders" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deadline_reminders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_invitations_tokenHash_key" ON "organization_invitations"("tokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "deadline_reminders_announcementId_kind_key" ON "deadline_reminders"("announcementId", "kind");

CREATE INDEX IF NOT EXISTS "offers_userId_idx" ON "offers"("userId");
CREATE INDEX IF NOT EXISTS "offers_bidderEmail_idx" ON "offers"("bidderEmail");
CREATE INDEX IF NOT EXISTS "offer_attachments_offerId_idx" ON "offer_attachments"("offerId");
CREATE INDEX IF NOT EXISTS "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");
CREATE INDEX IF NOT EXISTS "organization_invitations_organizationId_idx" ON "organization_invitations"("organizationId");
CREATE INDEX IF NOT EXISTS "organization_invitations_email_idx" ON "organization_invitations"("email");

DO $$ BEGIN
  ALTER TABLE "offers" ADD CONSTRAINT "offers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "offer_attachments" ADD CONSTRAINT "offer_attachments_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
