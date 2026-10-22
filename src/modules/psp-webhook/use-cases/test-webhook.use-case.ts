import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { SuccessResponseDto } from "../dto/success.response.dto";
import { TestWebhookDto, WebhookEvent } from "../dto/test-webhook.dto";
import { PspWebhookRepository } from "../repositories/psp-webhook.repository";

@Injectable()
export class TestWebhookUseCase {
  private readonly logger = new Logger(TestWebhookUseCase.name);

  constructor(private readonly pspWebhookRepository: PspWebhookRepository) {}

  async execute(pspId: string, id: string, dto: TestWebhookDto): Promise<SuccessResponseDto> {
    const webhook = await this.pspWebhookRepository.findById(id);
    if (!webhook) {
      throw new NotFoundException("Webhook not found");
    }

    const payload = this.buildPayload(dto, pspId);

    try {
      const response = await fetch(webhook.targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        this.logger.warn(`Message: Webhook request failed Status: ${response.status}`);
        throw new BadRequestException("Webhook request failed");
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Message: ${error?.message} | Payload: ${JSON.stringify(payload)}`);
      throw new BadRequestException("Webhook request failed");
    }
  }

  private buildPayload(dto: TestWebhookDto, pspId: string) {
    if (dto.event === WebhookEvent.TRANSFER_IN) {
      return {
        event: dto.event,
        pspId,
        keyId: dto.keyId,
        transferId: dto.transferId,
        amount: dto.amount,
      };
    }

    return {
      event: dto.event,
      pspId,
      transferId: dto.transferId,
      reason: dto.reason,
      status: dto.status,
    };
  }
}
