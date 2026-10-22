import { Global, Module } from "@nestjs/common";
import { DRIZZLE, DatabaseService } from "./database.service";

@Global()
@Module({
  providers: [
    DatabaseService,
    {
      provide: DRIZZLE,
      useFactory: (databaseService: DatabaseService) => databaseService.db,
      inject: [DatabaseService],
    },
  ],
  exports: [DatabaseService, DRIZZLE],
})
export class DatabaseModule {}
