-- Refuse to guess which historical record should survive. Resolve duplicates explicitly before deployment.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "offers"
    GROUP BY "announcementId", LOWER("bidderEmail")
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate offers exist for the same announcement and bidder email';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "offer_attachments"
    GROUP BY "fileName"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'An offer attachment file is assigned more than once';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "offers"
    WHERE "userId" IS NOT NULL
    GROUP BY "announcementId", "userId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'A contractor account submitted more than one offer to an announcement';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "users"
    GROUP BY LOWER(BTRIM("email"))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'User emails contain case-insensitive duplicates';
  END IF;
END $$;

-- Normalize identifiers before enforcing uniqueness.
UPDATE "offers" SET "bidderEmail" = LOWER(BTRIM("bidderEmail"));
UPDATE "users" SET "email" = LOWER(BTRIM("email"));

CREATE UNIQUE INDEX "offers_announcementId_bidderEmail_key"
  ON "offers"("announcementId", "bidderEmail");

CREATE UNIQUE INDEX "offers_announcementId_userId_key"
  ON "offers"("announcementId", "userId");

CREATE UNIQUE INDEX "offer_attachments_fileName_key"
  ON "offer_attachments"("fileName");

CREATE UNIQUE INDEX "users_email_lower_key"
  ON "users"(LOWER("email"));

ALTER TABLE "users"
  ALTER COLUMN "totpBackupCodes" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "totpBackupCodes" SET NOT NULL;

ALTER TABLE "email_outbox"
  ADD COLUMN "failedAt" TIMESTAMP(3),
  ADD COLUMN "lastError" TEXT;

CREATE INDEX "email_outbox_failedAt_availableAt_idx"
  ON "email_outbox"("failedAt", "availableAt");

-- Application audit is append-only. Controlled maintenance must opt in explicitly
-- within its database session: SET LOCAL app.audit_maintenance = 'on'.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.audit_maintenance', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_append_only
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
