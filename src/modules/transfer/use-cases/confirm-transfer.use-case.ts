import { Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfirmTransferDto } from "../dto/confirm-transfer.dto";
import { SuccessResponseDto } from "../dto/success.response.dto";
import { TransferRepository } from "../repositories/transfer.repository";
import { PspWebhookRepository } from "@modules/psp-webhook/repositories/psp-webhook.repository";
import {
  EventsNotificationType,
  newEventsNotification,
} from "@shared/events-notification/utils/utils";
import { DRIZZLE, DrizzleDB } from "@shared/database/database.service";
import { EventsNotificationRepository } from "@shared/events-notification/repository/events-notification.repository";
import { toCents } from "@shared/utils/utils";

@Injectable()
export class ConfirmTransferUseCase {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly transferRepository: TransferRepository,
    private readonly pspWebhookRepository: PspWebhookRepository,
    private readonly eventsNotificationRepository: EventsNotificationRepository,
  ) {}

  async execute(pspId: string, dto: ConfirmTransferDto): Promise<SuccessResponseDto> {
    const row = await this.transferRepository.findById(dto.id);
    if (!row) {
      throw new NotFoundException("Transfer not found");
    }

    if (row.pspOriginId === pspId) {
      throw new UnauthorizedException("Psp not Unauthorized");
    }

    const pspWebhook = await this.pspWebhookRepository.findByPspId(row.pspOriginId);
    if(!pspWebhook) {
        throw new NotFoundException("Psp not found")
    }

    const newEvents = newEventsNotification({
      pspId: row.pspOriginId,
      targetUrl: pspWebhook.targetUrl,
      eventType: EventsNotificationType.TRANSFER_ACK,
      payload: {
        ...dto,
        transferId: dto.id,
      },
    });

    const time = toCents((Date.now() - +row.time) / 1000);

    await this.db.transaction(async (tx) => {
      await this.transferRepository.ack(
        row.id,
        {
          ...dto,
          time,
          pspId: row.pspId,
        },
        tx,
      );
      await this.eventsNotificationRepository.create(newEvents, tx);
    });

    return { success: true };
  }
}
