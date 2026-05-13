ALTER TABLE "notification_log" ADD COLUMN "google_event_id" varchar(255);--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "google_calendar_synced_at" timestamp;