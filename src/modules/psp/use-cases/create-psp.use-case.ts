import { ConflictException, Injectable } from "@nestjs/common";
import { CreatePspDto } from "../dto/create-psp.dto";
import { PspResponseDto } from "../dto/psp.response.dto";
import { PspRepository } from "../repositories/psp.repository";
import { generateId } from "@shared/utils/utils";

@Injectable()
export class CreatePspUseCase {
  constructor(private readonly pspRepository: PspRepository) {}

  async execute(dto: CreatePspDto): Promise<PspResponseDto> {
    const existing = await this.pspRepository.exist(dto.document);
    if (existing) {
      throw new ConflictException("Document already registered");
    }
    const data = this.toData(dto);

    await this.pspRepository.create(data);
    return data;
  }
  private toData(dto: CreatePspDto) {
    return {
      id: generateId(),
      name: dto.name,
      document: dto.document,
    };
  }
}
