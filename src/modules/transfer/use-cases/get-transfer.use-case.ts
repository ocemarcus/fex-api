import { Injectable, NotFoundException } from "@nestjs/common";
import { TransferRepository } from "../repositories/transfer.repository";

@Injectable()
export class GetTransferUseCase {
  constructor(private readonly transferRepository: TransferRepository) {}

  async execute(pspId: string, id: string) {
    const row = await this.transferRepository.findById(id);
    if (!row) {
      throw new NotFoundException("Transfer not found");
    }
    row;
  }
}
