import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class AuthenticatePspDto {
  @ApiProperty({ example: "uuidv7", description: "API Key do PSP" })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  apiKey: string;

  @ApiProperty({ description: "Private key em Base64" })
  @IsString()
  @IsNotEmpty()
  privateKey: string;
}
