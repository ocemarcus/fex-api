import { ApiProperty } from "@nestjs/swagger";

export class CreatePspApiKeyResponseDto {
  @ApiProperty({ example: "123456" })
  id: string;

  @ApiProperty({ example: "121212" })
  pspId: string;

  @ApiProperty({ example: "uuidv7" })
  apiKey: string;

  @ApiProperty({
    description: "Private key em Base64. Retornada somente neste momento.",
  })
  privateKey: string;
}
