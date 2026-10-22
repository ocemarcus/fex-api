import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CreatePspKeyDto } from "../dto/create-psp-key.dto";
import { CreatePspKeyResponseDto } from "../dto/create-psp-key.response.dto";
import { PspKeyRepository } from "../repositories/psp-key.repository";
import { PspRepository } from "../../psp/repositories/psp.repository";
import { generateId } from "@shared/utils/utils";

@Injectable()
export class CreatePspKeyUseCase {
  constructor(private readonly pspKeyRepository: PspKeyRepository) {}

  async execute(pspId: string, dto: CreatePspKeyDto): Promise<CreatePspKeyResponseDto> {
    const existing = await this.pspKeyRepository.exist(dto.key, pspId);
    if (existing) {
      throw new ConflictException("Key already exists");
    }

    const data = this.toData(pspId, dto);

    await this.pspKeyRepository.create(data);
    return data;
  }
  private toData(pspId: string, dto: CreatePspKeyDto) {
    return {
      ...dto,
      pspId,
      id: generateId(),
    };
  }
}
