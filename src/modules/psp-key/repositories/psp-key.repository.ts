import { Inject, Injectable } from "@nestjs/common";
import { and, count, eq } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "../../../shared/database/database.service";
import { PspKeySchema } from "@shared/database/schema/psp-key.schema";
import { convertBigIntToString } from "@shared/utils/utils";
import { PspSchema } from "@shared/database/schema/psp.schema";

@Injectable()
export class PspKeyRepository {
  private readonly psp = PspSchema;
  private readonly pspKey = PspKeySchema;

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(data: { id: string; pspId: string; key: string; name: string; document: string }) {
    await this.db.insert(this.pspKey).values({
      ...data,
      id: BigInt(data.id),
      pspId: BigInt(data.pspId),
    });
  }

  async findById(id: string) {
    const [response] = await this.db
      .select()
      .from(this.pspKey)
      .where(eq(this.pspKey.id, BigInt(id)));

    return convertBigIntToString(response, ["id", "pspId"]);
  }

  async findByKey(key: string) {
    const [response] = await this.db.select().from(this.pspKey).where(eq(this.pspKey.key, key));

    return convertBigIntToString(response, ["id", "pspId"]);
  }

  async exist(key: string, pspId: string) {
    const [response] = await this.db
      .select({ total: count() })
      .from(this.pspKey)
      .where(and(eq(this.pspKey.key, key), eq(this.pspKey.pspId, BigInt(pspId))));
    return response.total > 0;
  }
  async findByKeyWithPsp(key: string) {
    const [response] = await this.db
      .select({
        id: this.pspKey.id,
        key: this.pspKey.key,
        name: this.pspKey.name,
        document: this.pspKey.document,
        psp: this.psp,
      })
      .from(this.pspKey)
      .innerJoin(this.psp, eq(this.psp.id, this.pspKey.pspId))
      .where(eq(this.pspKey.key, key));
    return {
      ...response,
      id: response.id.toString(),
    };
  }
}
