import { bigint, numeric, pgEnum, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { fexBaseSchema } from "./fex-base.schema";
import { PspSchema } from "./psp.schema";

export const PspWebhookSchema = pgTable("pspWebHoook", {
  ...fexBaseSchema,
  pspId: bigint({ mode: "bigint" })
    .notNull()
    .references(() => PspSchema.id),

  targetUrl: varchar().notNull(),
});
