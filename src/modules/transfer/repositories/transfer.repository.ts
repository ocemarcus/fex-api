import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq, InferEnum, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { TransferSchema, transferStatusEnum } from "@shared/database/schema/transfer.schema";
import { DRIZZLE, DrizzleDB } from "@shared/database/database.service";
import { convertBigIntToString } from "@shared/utils/utils";
import { PspSchema } from "@shared/database/schema/psp.schema";
import { PspKeySchema } from "@shared/database/schema/psp-key.schema";

export type TransferStatus = InferEnum<typeof transferStatusEnum>;

export type TransferListFilters = {
  pspId?: string;
  status?: TransferStatus;
  keyId?: string;
  page: number;
  limit: number;
};

@Injectable()
export class TransferRepository {
  private readonly psp = PspSchema;
  private readonly pspKey = PspKeySchema;

  private readonly transfer = TransferSchema;

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(
    data: {
      id: string;
      pspOriginId: string;
      pspId: string;
      keyId: string;
      amount: number;
      time: number;
      payerName: string;
      payerDocument: string;
    },
    tx: any,
  ) {
    await tx.insert(this.transfer).values({
      ...data,
      id: BigInt(data.id),
      pspId: BigInt(data.pspId),
      keyId: BigInt(data.keyId),
      pspOriginId: BigInt(data.pspOriginId),
    } as any);
  }

  async findById(id: string) {
    const [response] = await this.db
      .select()
      .from(this.transfer)
      .where(eq(this.transfer.id, BigInt(id)));

    return convertBigIntToString(response, ["id", "pspId", "pspOriginId", "keyId"]);
  }
  async ack(
    id: string,
    data: { pspId: string; reason?: string; time: number; status: TransferStatus },
    tx: any,
  ) {
    await tx
      .update(this.transfer)
      .set({
        time: data.time,
        status: data.status,
        reason: data.reason,
      })
      .where(and(eq(this.transfer.id, BigInt(id)), eq(this.transfer.pspId, BigInt(data.pspId))));
  }

  async list(filters: TransferListFilters) {
    const { pspId, status, keyId, page, limit } = filters;
    const payerPsp = alias(this.psp, "payee_psp");

    const where = and();

    const rows = await this.db
      .select({
        id: this.transfer.id,
        status: this.transfer.status,
        reason: this.transfer.reason,
        amount: this.transfer.amount,
        time: this.transfer.time,
        keyId: this.transfer.keyId,
        payerName: this.transfer.payerName,
        payerDocument: this.transfer.payerDocument,
        payerBank: payerPsp.name,
        payeeBank: this.psp.name,
        key: this.pspKey.key,
        keyName: this.pspKey.name,
        keyDocument: this.pspKey.document,
      })
      .from(this.transfer)
      .innerJoin(this.psp, eq(this.psp.id, this.transfer.pspId))
      .innerJoin(payerPsp, eq(payerPsp.id, this.transfer.pspOriginId))
      .innerJoin(this.pspKey, eq(this.pspKey.id, this.transfer.keyId))
      .where(where)
      .orderBy(desc(this.transfer.id))
      .offset((page - 1) * limit)
      .limit(limit);

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(this.transfer)
      .innerJoin(this.psp, eq(this.psp.id, this.transfer.pspId))
      .innerJoin(payerPsp, eq(payerPsp.id, this.transfer.pspOriginId))
      .innerJoin(this.pspKey, eq(this.pspKey.id, this.transfer.keyId))
      .where(where);

    return { rows, total: totalRow?.total ?? 0 };
  }
}

export type TransferDetails = NonNullable<Awaited<ReturnType<TransferRepository["findById"]>>>;
