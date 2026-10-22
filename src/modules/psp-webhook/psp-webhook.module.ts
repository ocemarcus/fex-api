import { Module } from "@nestjs/common";
import { PspWebhookController } from "./controllers/psp-webhook.controller";
import { PspWebhookRepository } from "./repositories/psp-webhook.repository";
import { CreateWebhookUseCase } from "./use-cases/create-webhook.use-case";
import { TestWebhookUseCase } from "./use-cases/test-webhook.use-case";

@Module({
  controllers: [PspWebhookController],
  providers: [PspWebhookRepository, CreateWebhookUseCase, TestWebhookUseCase],
})
export class PspWebhookModule {}
