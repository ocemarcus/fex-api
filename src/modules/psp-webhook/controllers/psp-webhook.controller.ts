import { Body, Controller, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../shared/auth/jwt-auth.guard";
import type { AuthenticatedRequest } from "../../../shared/auth/types";
import { CreateWebhookDto } from "../dto/create-webhook.dto";
import { CreateWebhookResponseDto } from "../dto/create-webhook.response.dto";
import { SuccessResponseDto } from "../dto/success.response.dto";
import { TestWebhookDto } from "../dto/test-webhook.dto";
import { CreateWebhookUseCase } from "../use-cases/create-webhook.use-case";
import { TestWebhookUseCase } from "../use-cases/test-webhook.use-case";

@ApiTags("PSP Webhooks")
@ApiBearerAuth()
@Controller("/api/psp/webhook")
@UseGuards(JwtAuthGuard)
export class PspWebhookController {
  constructor(
    private readonly createWebhookUseCase: CreateWebhookUseCase,
    private readonly testWebhookUseCase: TestWebhookUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: "Criar novo Webhook" })
  @ApiCreatedResponse({ description: "Webhook criado", type: CreateWebhookResponseDto })
  create(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreateWebhookDto,
  ): Promise<CreateWebhookResponseDto> {
    return this.createWebhookUseCase.execute(request.user.pspId, dto);
  }

  @Patch(":id/test")
  @ApiOperation({ summary: "Enviar teste para webhook" })
  @ApiParam({ name: "id", example: "32323" })
  @ApiOkResponse({ description: "Teste enviado", type: SuccessResponseDto })
  @ApiNotFoundResponse({ description: "Webhook não encontrado" })
  @ApiBadRequestResponse({ description: "Webhook request failed" })
  test(
    @Request() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: TestWebhookDto,
  ): Promise<SuccessResponseDto> {
    return this.testWebhookUseCase.execute(request.user.pspId, id, dto);
  }
}
