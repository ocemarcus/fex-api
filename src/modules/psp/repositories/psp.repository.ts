import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE, DrizzleDB } from "@shared/database/database.service";
import { PspSchema } from "@shared/database/schema/psp.schema";
import { convertBigIntToString } from "@shared/utils/utils";
import { count, eq } from "drizzle-orm";

@Injectable()
export class PspRepository {
  private readonly psp = PspSchema;

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(data: { id: string; name: string; document: string }) {
    await this.db.insert(this.psp).values({
      ...data,
      id: BigInt(data.id),
    });
  }

  async findById(id: string) {
    const [response] = await this.db
      .select()
      .from(this.psp)
      .where(eq(this.psp.id, BigInt(id)));

    return convertBigIntToString(response, ["id"]);
  }

  async exist(document: string) {
    const [response] = await this.db
      .select({ total: count() })
      .from(this.psp)
      .where(eq(this.psp.document, document));

    return response.total > 0;
  }
}
