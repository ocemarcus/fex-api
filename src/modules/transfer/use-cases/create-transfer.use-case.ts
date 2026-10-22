import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PspKeyRepository } from "../../psp-key/repositories/psp-key.repository";
import { CreateTransferDto } from "../dto/create-transfer.dto";
import { CreateTransferResponseDto } from "../dto/create-transfer.response.dto";
import { TransferRepository } from "../repositories/transfer.repository";
import { generateId, toCents } from "@shared/utils/utils";
import { DRIZZLE, DrizzleDB } from "@shared/database/database.service";
import {
  EventsNotificationType,
  newEventsNotification,
} from "@shared/events-notification/utils/utils";
import { EventsNotificationRepository } from "@shared/events-notification/repository/events-notification.repository";
import { PspWebhookRepository } from "@modules/psp-webhook/repositories/psp-webhook.repository";
import { LOGGER_EVENTS } from "@shared/utils/logger.events";

@Injectable()
export class CreateTransferUseCase {
  private readonly logger = new Logger(CreateTransferDto.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly pspKeyRepository: PspKeyRepository,
    private readonly pspWebhookRepository: PspWebhookRepository,
    private readonly transferRepository: TransferRepository,
    private readonly eventsNotificationRepository: EventsNotificationRepository,
  ) {}

  async execute(pspOriginId: string, dto: CreateTransferDto): Promise<CreateTransferResponseDto> {
    const tranceId = generateId();

    this.logger.log({
      tranceId,
      event: LOGGER_EVENTS.CREATE_TRANSFER,
      payload: {
        ...dto,
        pspOriginId,
      },
    });
    const keyRow = await this.pspKeyRepository.findById(dto.keyId);

    if (!keyRow) {
      throw new NotFoundException("Key not found");
    }

    if (keyRow.pspId === pspOriginId) {
      throw new UnauthorizedException("Psp not Unauthorized");
    }

    try {
      const newTransfer = this.newTransfer(pspOriginId, keyRow.id, keyRow.pspId, dto);

      const pspWebhook = await this.pspWebhookRepository.findByPspId(keyRow.pspId);
      if(!pspWebhook) {
        throw new NotFoundException("Psp not found")
      }

      const newEvents = newEventsNotification({
        pspId: newTransfer.pspId,
        targetUrl: pspWebhook.targetUrl,
        eventType: EventsNotificationType.TRANSFER_IN,
        payload: {
          status: "IN_PROCESS",
          amount: newTransfer.amount,
          transferId: newTransfer.id,
        },
      });

      await this.db.transaction(async (tx) => {
        await this.transferRepository.create(newTransfer, tx);
        await this.eventsNotificationRepository.create(newEvents, tx);
      });

      return {
        key: keyRow.key,
        id: newTransfer.id,
        amount: newTransfer.amount,
      };
    } catch (error) {
      this.logger.error({
        tranceId,
        event: LOGGER_EVENTS.CREATE_TRANSFER,
        error: error?.message,
      });
      throw new BadRequestException("Internal error");
    }
  }
  private newTransfer(pspOriginId: string, keyId: string, pspId: string, dto: CreateTransferDto) {
    return {
      pspId,
      keyId,
      pspOriginId,
      id: generateId(),
      time: Date.now(),
      payerName: dto.holder.name,
      payerDocument: dto.holder.document,
      amount: toCents(dto.amount / 100),
    };
  }
}
