ALTER TABLE "notification_log" ADD COLUMN "google_event_id" varchar(255);--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "google_calendar_synced_at" timestamp;--> statement-breakpoint
CREATE INDEX "notification_log_google_event_idx" ON "notification_log" USING btree ("google_event_id");
