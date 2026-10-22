import { bigint, timestamp } from "drizzle-orm/pg-core";

export const fexBaseSchema = {
  id: bigint({ mode: "bigint" }).primaryKey(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
};
