ALTER TYPE "public"."cover_type" ADD VALUE 'medical';--> statement-breakpoint
ALTER TYPE "public"."insurance_type" ADD VALUE 'Motor - Private' BEFORE 'Motor - Private Comp';--> statement-breakpoint
ALTER TABLE "car_sales_customers" DROP COLUMN "created_at";