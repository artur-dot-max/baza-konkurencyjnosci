ALTER TABLE "announcements" ADD COLUMN "submissionMethods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "announcements"
SET "submissionMethods" = ARRAY["submissionMethod"]
WHERE "submissionMethod" IS NOT NULL AND BTRIM("submissionMethod") <> '';

ALTER TABLE "announcements" DROP COLUMN "submissionMethod";
