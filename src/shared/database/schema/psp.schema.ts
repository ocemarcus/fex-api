import { index, pgTable, varchar } from "drizzle-orm/pg-core";
import { fexBaseSchema } from "./fex-base.schema";

export const PspSchema = pgTable(
  "psp",
  {
    ...fexBaseSchema,
    name: varchar().notNull(),
    document: varchar().notNull().unique(),
  },
  (table) => [index("psp_document_idx").on(table.document)],
);
