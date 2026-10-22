ALTER TABLE "eventsNotification" ALTER COLUMN "eventType" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "eventsNotification" ADD COLUMN "targetUrl" varchar NOT NULL;