import { bigint, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { PspSchema } from "./psp.schema";
import { fexBaseSchema } from "./fex-base.schema";

export const PspApiKeySchema = pgTable(
  "pspApiKey",
  {
    ...fexBaseSchema,
    pspId: bigint({ mode: "bigint" })
      .notNull()
      .references(() => PspSchema.id),
    apiKey: uuid().notNull().unique(),
    privateKey: text().notNull(),
    publicKey: text().notNull(),
  },
  (table) => [index("pspApiKeyPspIdIdx").on(table.pspId)],
);
