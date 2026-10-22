import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUrl, MaxLength } from "class-validator";

export class CreateWebhookDto {
  @ApiProperty({ example: "http://localhost:3000/webhook", description: "URL do webhook" })
  @IsString()
  @IsNotEmpty()
  @IsUrl({
    protocols: ["http", "https"],
    require_protocol: true,
  })
  @MaxLength(2048)
  targetUrl: string;
}
