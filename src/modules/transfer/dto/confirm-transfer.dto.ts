import { ApiProperty } from "@nestjs/swagger";
import { transferStatusEnum } from "@shared/database/schema/transfer.schema";
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { TransferStatus } from "../repositories/transfer.repository";

export class ConfirmTransferDto {
  @ApiProperty({ example: "11111", description: "ID da transferência" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: "id must be a numeric id" })
  id: string;

  @ApiProperty({ example: "OK", enum: transferStatusEnum.enumValues, description: "Novo status" })
  @IsEnum(transferStatusEnum.enumValues)
  status: TransferStatus;

  @ApiProperty({ example: "ok", required: false, description: "Motivo da confirmação" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
