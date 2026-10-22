import { ApiProperty } from "@nestjs/swagger";
import { transferStatusEnum } from "@shared/database/schema/transfer.schema";

export class TransferHolderResponseDto {
  @ApiProperty({ example: "Marcus" })
  name: string;

  @ApiProperty({ example: "22434332" })
  document: string;
}

export class TransferPayerResponseDto {
  @ApiProperty({ example: "PSP A" })
  bank: string;

  @ApiProperty({ type: TransferHolderResponseDto })
  holder: TransferHolderResponseDto;
}

export class TransferPayeeResponseDto {
  @ApiProperty({ example: "PSP B" })
  bank: string;

  @ApiProperty({ example: "+553232323232" })
  key: string;

  @ApiProperty({ type: TransferHolderResponseDto })
  holder: TransferHolderResponseDto;
}

export class TransferResponseDto {
  @ApiProperty({ example: "12313" })
  id: string;

  @ApiProperty({ example: "OK", enum: transferStatusEnum.enumValues })
  status: string;

  @ApiProperty({ example: "ok", required: false })
  reason: string;

  @ApiProperty({ example: "1000", description: "Valor em precisão decimal" })
  amount: number;

  @ApiProperty({ example: "12121212" })
  keyId: string;

  @ApiProperty({ example: "Tempo da transação 1s" })
  time: string;

  @ApiProperty({ type: TransferPayerResponseDto })
  payer: TransferPayerResponseDto;

  @ApiProperty({ type: TransferPayeeResponseDto })
  payee: TransferPayeeResponseDto;
}
