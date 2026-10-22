import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreatePspDto {
  @ApiProperty({ example: "PSP A", description: "Nome do PSP" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: "212121", description: "Documento único do PSP" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  document: string;
}
