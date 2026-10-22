import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE, DrizzleDB } from "@shared/database/database.service";
import { PspApiKeySchema } from "@shared/database/schema/psp-api-key.schema";
import { eq } from "drizzle-orm";

@Injectable()
export class PspApiKeyRepository {
  private readonly pspApiKey = PspApiKeySchema;

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(data: {
    id: string;
    pspId: string;
    apiKey: string;
    privateKey: string;
    publicKey: string;
  }) {
    await this.db.insert(this.pspApiKey).values({
      ...data,
      id: BigInt(data.id),
      pspId: BigInt(data.pspId),
    });
  }

  async findByApiKey(apiKey: string) {
    const [response] = await this.db
      .select()
      .from(this.pspApiKey)
      .where(eq(this.pspApiKey.apiKey, apiKey));
    return response;
  }
}
