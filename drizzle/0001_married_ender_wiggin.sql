CREATE TYPE "public"."eventsStatus" AS ENUM('PENDING', 'FAILED', 'SENT');--> statement-breakpoint
CREATE TABLE "eventsNotification" (
	"id" bigint PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"pspId" bigint,
	"payload" text,
	"eventType" varchar,
	"status" "eventsStatus" DEFAULT 'PENDING',
	"retryAt" timestamp,
	"retryCount" numeric DEFAULT '0'
);
--> statement-breakpoint
ALTER TABLE "pspWebHoook" ADD COLUMN "targetUrl" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "eventsNotification" ADD CONSTRAINT "eventsNotification_pspId_psp_id_fk" FOREIGN KEY ("pspId") REFERENCES "public"."psp"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pspWebHoook" DROP COLUMN "url";