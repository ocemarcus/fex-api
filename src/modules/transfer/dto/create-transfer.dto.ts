import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class TransferHolderDto {
  @ApiProperty({ example: "Marcus", description: "Nome do pagador" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: "22434332", description: "Documento do pagador" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  document: string;
}

export class CreateTransferDto {
  @ApiProperty({ example: 1000, description: "Valor da transferência" })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "amount must be a number with at most 2 decimal places" },
  )
  @Min(0.01, { message: "amount must be greater than zero" })
  amount: number;

  @ApiProperty({ example: "12112121", description: "ID da chave de destino" })
  @IsNumberString()
  @IsNotEmpty()
  keyId: string;

  @ApiProperty({ type: TransferHolderDto, description: "Dados do pagador" })
  @ValidateNested()
  @Type(() => TransferHolderDto)
  holder: TransferHolderDto;
}
