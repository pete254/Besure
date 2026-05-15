-- Create commission_status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "commission_status" AS ENUM ('Pending', 'Paid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create commissions table
CREATE TABLE IF NOT EXISTS "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"insurer_id" uuid,
	"commission_amount" numeric(14, 2) NOT NULL,
	"expected_due_date" date NOT NULL,
	"settled_date" date,
	"status" "commission_status" NOT NULL DEFAULT 'Pending',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT commissions_policy_id_fk FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE cascade,
	CONSTRAINT commissions_customer_id_fk FOREIGN KEY ("customer_id") REFERENCES "customers"("id"),
	CONSTRAINT commissions_insurer_id_fk FOREIGN KEY ("insurer_id") REFERENCES "insurers"("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "commissions_policy_idx" on "commissions" ("policy_id");
CREATE INDEX IF NOT EXISTS "commissions_customer_idx" on "commissions" ("customer_id");
CREATE INDEX IF NOT EXISTS "commissions_insurer_idx" on "commissions" ("insurer_id");
CREATE INDEX IF NOT EXISTS "commissions_expected_due_date_idx" on "commissions" ("expected_due_date");
CREATE INDEX IF NOT EXISTS "commissions_status_idx" on "commissions" ("status");
CREATE INDEX IF NOT EXISTS "commissions_settled_date_idx" on "commissions" ("settled_date");
