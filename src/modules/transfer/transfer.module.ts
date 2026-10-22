import { Module } from "@nestjs/common";
import { PspKeyModule } from "../psp-key/psp-key.module";
import { TransferController } from "./controllers/transfer.controller";
import { TransferListController } from "./controllers/transfer-list.controller";
import { TransferRepository } from "./repositories/transfer.repository";
import { ConfirmTransferUseCase } from "./use-cases/confirm-transfer.use-case";
import { CreateTransferUseCase } from "./use-cases/create-transfer.use-case";
import { GetTransferUseCase } from "./use-cases/get-transfer.use-case";
import { ListTransfersUseCase } from "./use-cases/list-transfers.use-case";
import { EventsNotificationRepository } from "@shared/events-notification/repository/events-notification.repository";
import { PspWebhookRepository } from "@modules/psp-webhook/repositories/psp-webhook.repository";

@Module({
  imports: [PspKeyModule],
  controllers: [TransferController, TransferListController],
  providers: [
    TransferRepository,
    CreateTransferUseCase,
    ConfirmTransferUseCase,
    GetTransferUseCase,
    ListTransfersUseCase,
    EventsNotificationRepository,
    PspWebhookRepository,
  ],
})
export class TransferModule {}
