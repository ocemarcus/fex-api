import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class CreatePspApiKeyDto {
  @ApiProperty({ example: "121212", description: "ID do PSP" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: "pspId must be a numeric id" })
  pspId: string;
}
