import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { PspKeyModule } from "./modules/psp-key/psp-key.module";
import { PspWebhookModule } from "./modules/psp-webhook/psp-webhook.module";
import { PspModule } from "./modules/psp/psp.module";
import { TransferModule } from "./modules/transfer/transfer.module";
import { AuthModule } from "./shared/auth/auth.module";
import { RsaModule } from "./shared/crypto/rsa.module";
import { DatabaseModule } from "./shared/database/database.module";
import { AllExceptionsFilter } from "./shared/errors/all-exceptions.filter";
import { EventsNotificationModule } from "@shared/events-notification/events-notification.module";
import { HttpModule } from "@nestjs/axios";
import * as http from "http";
import * as https from "https";
import { LoggerModule } from "nestjs-pino";

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
      },
    }),
    HttpModule.register({
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    EventsNotificationModule,
    AuthModule,
    RsaModule,
    PspModule,
    PspKeyModule,
    PspWebhookModule,
    TransferModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
