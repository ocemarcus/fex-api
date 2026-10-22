import { Injectable, NotFoundException } from "@nestjs/common";
import { PspKeyResponseDto } from "../dto/psp-key.response.dto";
import { PspKeyRepository } from "../repositories/psp-key.repository";

@Injectable()
export class GetPspKeyUseCase {
  constructor(private readonly pspKeyRepository: PspKeyRepository) {}

  async execute(pspId: string, key: string): Promise<PspKeyResponseDto> {
    const row = await this.pspKeyRepository.findByKeyWithPsp(key);
    if (!row) {
      throw new NotFoundException("Key not found");
    }
    return {
      id: row.id,
      key: row.key,
      name: row.name,
      document: row.document,
      psp: { name: row.psp.name },
    };
  }
}
