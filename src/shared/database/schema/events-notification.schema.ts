import { bigint, numeric, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { fexBaseSchema } from "./fex-base.schema";
import { PspSchema } from "./psp.schema";

export const eventsStatusEnum = pgEnum("eventsStatus", ["PENDING", "FAILED", "SENT", "PROCESSING"]);

export const EventsNotificationSchema = pgTable("eventsNotification", {
  ...fexBaseSchema,

  pspId: bigint({ mode: "bigint" }).references(() => PspSchema.id),

  payload: text(),
  eventType: varchar().notNull(),
  targetUrl: varchar().notNull(),
  status: eventsStatusEnum().default("PENDING"),

  retryAt: timestamp(),
  retryCount: numeric().default("0"),
});
