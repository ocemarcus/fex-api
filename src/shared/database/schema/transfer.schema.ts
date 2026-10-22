import { bigint, index, numeric, pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";
import { PspSchema } from "./psp.schema";
import { PspKeySchema } from "./psp-key.schema";
import { fexBaseSchema } from "./fex-base.schema";

export const transferStatusEnum = pgEnum("transferStatus", ["OK", "REJECT", "IN_PROCESS"]);

export const TransferSchema = pgTable(
  "transfer",
  {
    ...fexBaseSchema,
    pspOriginId: bigint({ mode: "bigint" })
      .notNull()
      .references(() => PspSchema.id),
    pspId: bigint({ mode: "bigint" })
      .notNull()
      .references(() => PspSchema.id),
    keyId: bigint({ mode: "bigint" })
      .notNull()
      .references(() => PspKeySchema.id),
    amount: numeric().notNull(),
    status: transferStatusEnum().notNull().default("IN_PROCESS"),
    reason: varchar(),
    time: numeric().notNull(),
    payerName: varchar().notNull(),
    payerDocument: varchar().notNull(),
  },
  (table) => [
    index("transferPspIdIdx").on(table.pspId),
    index("transferKeyIdIdx").on(table.keyId),
    index("transferStatusIdx").on(table.status),
    index("transferPspStatusIdx").on(table.pspId, table.status),
  ],
);
