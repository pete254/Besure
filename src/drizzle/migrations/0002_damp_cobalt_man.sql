ALTER TABLE "car_sales_reminders" ADD COLUMN "google_event_id" varchar(255);--> statement-breakpoint
ALTER TABLE "car_sales_reminders" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_refresh_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_access_token" text;--> statement-breakpoint
CREATE INDEX "car_sales_reminders_google_event_idx" ON "car_sales_reminders" USING btree ("google_event_id");