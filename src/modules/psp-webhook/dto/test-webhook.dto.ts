import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";

export enum WebhookEvent {
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_ASK = "TRANSFER_ASK",
}

export class TestWebhookDto {
  @ApiProperty({ example: "TRANSFER_IN", enum: WebhookEvent, description: "Evento do webhook" })
  @IsEnum(WebhookEvent)
  event: WebhookEvent;

  @ApiProperty({ example: "23232", required: false, description: "ID do PSP" })
  @IsOptional()
  @IsNumberString()
  pspId?: string;

  @ApiProperty({ example: "123131", required: false, description: "ID da chave" })
  @ValidateIf((o: TestWebhookDto) => o.event === WebhookEvent.TRANSFER_IN)
  @IsNumberString()
  keyId?: string;

  @ApiProperty({ example: "1313131", description: "ID da transferência" })
  @IsNumberString()
  transferId: string;

  @ApiProperty({ example: 1000, required: false, description: "Valor da transferência" })
  @ValidateIf((o: TestWebhookDto) => o.event === WebhookEvent.TRANSFER_IN)
  @IsNumber()
  amount?: number;

  @ApiProperty({ example: "ok", required: false, description: "Motivo da transferência" })
  @ValidateIf((o: TestWebhookDto) => o.event === WebhookEvent.TRANSFER_ASK)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason?: string;

  @ApiProperty({
    example: "OK",
    required: false,
    enum: ["OK", "REJECT"],
    description: "Status da transferência",
  })
  @ValidateIf((o: TestWebhookDto) => o.event === WebhookEvent.TRANSFER_ASK)
  @IsIn(["OK", "REJECT"])
  status?: "OK" | "REJECT";
}
