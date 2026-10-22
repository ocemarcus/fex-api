import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreatePspKeyDto {
  @ApiProperty({ example: "+55223345432133", description: "Chave do cliente" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  key: string;

  @ApiProperty({ example: "Marcus", description: "Nome do cliente" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: "22434332", description: "Documento do cliente" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  document: string;
}
