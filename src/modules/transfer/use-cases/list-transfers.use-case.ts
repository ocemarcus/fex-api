import { BadRequestException, Injectable } from "@nestjs/common";
import { ListTransfersDto } from "../dto/list-transfers.dto";
import { ListTransfersResponseDto } from "../dto/list-transfers.response.dto";
import { TransferRepository } from "../repositories/transfer.repository";

@Injectable()
export class ListTransfersUseCase {
  constructor(private readonly transferRepository: TransferRepository) {}

  async execute(dto: ListTransfersDto): Promise<ListTransfersResponseDto> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    try {
      const { rows, total } = await this.transferRepository.list({
        page,
        limit,
        keyId: dto.keyId,
        status: dto.status,
      });

      return {
        data: rows.map(
          (row) =>
            ({
              id: row.id.toString(),
              status: row.status,
              reason: row.reason,
              amount: +row.amount,
              keyId: row.keyId.toString(),
              time: row.status === "IN_PROCESS" ? null : `${+row.time / 100}s`,
              payer: {
                bank: row.payerBank,
                holder: {
                  name: row.payerName,
                  document: row.payerDocument,
                },
              },
              payee: {
                key: row.key,
                bank: row.payeeBank,
                holder: {
                  name: row.keyName,
                  document: row.keyDocument,
                },
              },
            }) as any,
        ),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      throw new BadRequestException("Internal error");
    }
  }
}
