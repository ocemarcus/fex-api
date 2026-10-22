import { ApiProperty } from "@nestjs/swagger";
import { TransferResponseDto } from "./transfer.response.dto";

export class PaginationDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 1 })
  total: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

export class ListTransfersResponseDto {
  @ApiProperty({ type: TransferResponseDto, isArray: true })
  data: TransferResponseDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;
}
