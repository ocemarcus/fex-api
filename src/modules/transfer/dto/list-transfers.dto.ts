import { ApiProperty } from "@nestjs/swagger";
import { transferStatusEnum } from "@shared/database/schema/transfer.schema";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from "class-validator";
import { TransferStatus } from "../repositories/transfer.repository";

export class ListTransfersDto {
  @ApiProperty({ example: 1, required: false, default: 1, description: "Número da página" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 20, required: false, default: 20, description: "Quantidade por página" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    example: "OK",
    required: false,
    enum: transferStatusEnum.enumValues,
    description: "Filtro por status",
  })
  @IsOptional()
  @IsEnum(transferStatusEnum.enumValues)
  status?: TransferStatus;

  @ApiProperty({ example: "121212", required: false, description: "Filtro por chave" })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: "keyId must be a numeric id" })
  keyId?: string;
}
