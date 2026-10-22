import { bigint, index, pgTable, varchar } from "drizzle-orm/pg-core";
import { fexBaseSchema } from "./fex-base.schema";
import { PspSchema } from "./psp.schema";

export const PspKeySchema = pgTable(
  "pspKey",
  {
    ...fexBaseSchema,
    pspId: bigint({ mode: "bigint" })
      .notNull()
      .references(() => PspSchema.id),

    name: varchar().notNull(),
    document: varchar().notNull(),
    key: varchar().notNull().unique(),
  },
  (table) => [
    index("pspKeyPspIdIdx").on(table.pspId),
    index("pspKeyKeyIdx").on(table.key),
    index("pspKeyDocumentIdx").on(table.document),
  ],
);
