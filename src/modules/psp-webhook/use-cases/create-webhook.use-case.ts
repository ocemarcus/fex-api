import { Injectable } from "@nestjs/common";
import { generateId } from "@shared/utils/utils";
import { CreateWebhookDto } from "../dto/create-webhook.dto";
import { CreateWebhookResponseDto } from "../dto/create-webhook.response.dto";
import { PspWebhookRepository } from "../repositories/psp-webhook.repository";

@Injectable()
export class CreateWebhookUseCase {
  constructor(private readonly pspWebhookRepository: PspWebhookRepository) {}

  async execute(pspId: string, dto: CreateWebhookDto): Promise<CreateWebhookResponseDto> {
    const data = {
      id: generateId(),
      pspId,
      targetUrl: dto.targetUrl,
    };

    await this.pspWebhookRepository.create(data);
    return data;
  }
}
