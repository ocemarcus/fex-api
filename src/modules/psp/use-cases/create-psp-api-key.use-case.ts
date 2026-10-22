import { Injectable } from "@nestjs/common";
import { RsaService } from "../../../shared/crypto/rsa.service";
import { CreatePspApiKeyDto } from "../dto/create-psp-api-key.dto";
import { CreatePspApiKeyResponseDto } from "../dto/create-psp-api-key.response.dto";
import { PspApiKeyRepository } from "../repositories/psp-api-key.repository";
import { generateId } from "@shared/utils/utils";

@Injectable()
export class CreatePspApiKeyUseCase {
  constructor(
    private readonly pspApiKeyRepository: PspApiKeyRepository,
    private readonly rsaService: RsaService,
  ) {}

  async execute(dto: CreatePspApiKeyDto): Promise<CreatePspApiKeyResponseDto> {
    const data = this.toData(dto.pspId);

    await this.pspApiKeyRepository.create(data);
    return data;
  }
  private toData(pspId: string) {
    const apiKey = crypto.randomUUID();
    const keyPair = this.rsaService.generateKeyPair();

    return {
      pspId,
      apiKey,
      id: generateId(),
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };
  }
}
