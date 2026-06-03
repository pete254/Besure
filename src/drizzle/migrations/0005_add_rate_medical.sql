-- Add rate_medical column to insurers with 10% default
ALTER TABLE "insurers" ADD COLUMN IF NOT EXISTS "rate_medical" numeric(5,2);
UPDATE "insurers" SET "rate_medical" = 10.00 WHERE "rate_medical" IS NULL;
