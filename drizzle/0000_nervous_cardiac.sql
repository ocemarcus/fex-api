CREATE TYPE "public"."transferStatus" AS ENUM('OK', 'REJECT', 'IN_PROCESS');--> statement-breakpoint
CREATE TABLE "pspApiKey" (
	"id" bigint PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"pspId" bigint NOT NULL,
	"apiKey" uuid NOT NULL,
	"privateKey" text NOT NULL,
	"publicKey" text NOT NULL,
	CONSTRAINT "pspApiKey_apiKey_unique" UNIQUE("apiKey")
);
--> statement-breakpoint
CREATE TABLE "pspKey" (
	"id" bigint PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"pspId" bigint NOT NULL,
	"name" varchar NOT NULL,
	"document" varchar NOT NULL,
	"key" varchar NOT NULL,
	CONSTRAINT "pspKey_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "pspWebHoook" (
	"id" bigint PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"pspId" bigint NOT NULL,
	"url" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "psp" (
	"id" bigint PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar NOT NULL,
	"document" varchar NOT NULL,
	CONSTRAINT "psp_document_unique" UNIQUE("document")
);
--> statement-breakpoint
CREATE TABLE "transfer" (
	"id" bigint PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"pspOriginId" bigint NOT NULL,
	"pspId" bigint NOT NULL,
	"keyId" bigint NOT NULL,
	"amount" numeric NOT NULL,
	"status" "transferStatus" DEFAULT 'IN_PROCESS' NOT NULL,
	"reason" varchar,
	"time" numeric NOT NULL,
	"payerName" varchar NOT NULL,
	"payerDocument" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pspApiKey" ADD CONSTRAINT "pspApiKey_pspId_psp_id_fk" FOREIGN KEY ("pspId") REFERENCES "public"."psp"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pspKey" ADD CONSTRAINT "pspKey_pspId_psp_id_fk" FOREIGN KEY ("pspId") REFERENCES "public"."psp"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pspWebHoook" ADD CONSTRAINT "pspWebHoook_pspId_psp_id_fk" FOREIGN KEY ("pspId") REFERENCES "public"."psp"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_pspOriginId_psp_id_fk" FOREIGN KEY ("pspOriginId") REFERENCES "public"."psp"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_pspId_psp_id_fk" FOREIGN KEY ("pspId") REFERENCES "public"."psp"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_keyId_pspKey_id_fk" FOREIGN KEY ("keyId") REFERENCES "public"."pspKey"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pspApiKeyPspIdIdx" ON "pspApiKey" USING btree ("pspId");--> statement-breakpoint
CREATE INDEX "pspKeyPspIdIdx" ON "pspKey" USING btree ("pspId");--> statement-breakpoint
CREATE INDEX "pspKeyKeyIdx" ON "pspKey" USING btree ("key");--> statement-breakpoint
CREATE INDEX "pspKeyDocumentIdx" ON "pspKey" USING btree ("document");--> statement-breakpoint
CREATE INDEX "psp_document_idx" ON "psp" USING btree ("document");--> statement-breakpoint
CREATE INDEX "transferPspIdIdx" ON "transfer" USING btree ("pspId");--> statement-breakpoint
CREATE INDEX "transferKeyIdIdx" ON "transfer" USING btree ("keyId");--> statement-breakpoint
CREATE INDEX "transferStatusIdx" ON "transfer" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transferPspStatusIdx" ON "transfer" USING btree ("pspId","status");