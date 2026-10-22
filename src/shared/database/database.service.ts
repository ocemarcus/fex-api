import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const DRIZZLE = Symbol("DRIZZLE");

export type DrizzleDB = NodePgDatabase;

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  readonly db: DrizzleDB;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.getOrThrow<string>("DATABASE_URL");
    this.pool = new Pool({ connectionString });
    this.db = drizzle(this.pool);
  }
  async onApplicationShutdown(): Promise<void> {
    this.logger.log("Finish database pool");
    await this.pool.end();
  }
}
