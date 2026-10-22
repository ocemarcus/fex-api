import { ApiProperty } from "@nestjs/swagger";

export class CreateWebhookResponseDto {
  @ApiProperty({ example: "32323" })
  id: string;

  @ApiProperty({ example: "23232" })
  pspId: string;

  @ApiProperty({ example: "http://localhost:3000/webhook" })
  targetUrl: string;
}
