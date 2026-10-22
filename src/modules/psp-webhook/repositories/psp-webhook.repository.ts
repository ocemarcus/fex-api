import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "@shared/database/database.service";
import { PspWebhookSchema } from "@shared/database/schema/psp-webhook.schema";
import { convertBigIntToString } from "@shared/utils/utils";

@Injectable()
export class PspWebhookRepository {
  private readonly pspWebhook = PspWebhookSchema;

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(data: { id: string; pspId: string; targetUrl: string }) {
    await this.db.insert(this.pspWebhook).values({
      ...data,
      id: BigInt(data.id),
      pspId: BigInt(data.pspId),
    });
  }

  async findById(id: string) {
    const [response] = await this.db
      .select()
      .from(this.pspWebhook)
      .where(eq(this.pspWebhook.id, BigInt(id)));

    return convertBigIntToString(response, ["id", "pspId"]);
  }
  async findByPspId(pspId: string) {
    const [response] = await this.db
      .select()
      .from(this.pspWebhook)
      .where(eq(this.pspWebhook.pspId, BigInt(pspId)));

    return convertBigIntToString(response, ["id", "pspId"]);
  }
}
