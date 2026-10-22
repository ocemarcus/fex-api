import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../shared/auth/jwt-auth.guard";
import type { AuthenticatedRequest } from "../../../shared/auth/types";
import { ConfirmTransferDto } from "../dto/confirm-transfer.dto";
import { CreateTransferDto } from "../dto/create-transfer.dto";
import { CreateTransferResponseDto } from "../dto/create-transfer.response.dto";
import { SuccessResponseDto } from "../dto/success.response.dto";
import { TransferResponseDto } from "../dto/transfer.response.dto";
import { ConfirmTransferUseCase } from "../use-cases/confirm-transfer.use-case";
import { CreateTransferUseCase } from "../use-cases/create-transfer.use-case";
import { GetTransferUseCase } from "../use-cases/get-transfer.use-case";

@ApiTags("PSP Transfers")
@ApiBearerAuth()
@Controller("/api/psp/transfer")
@UseGuards(JwtAuthGuard)
export class TransferController {
  constructor(
    private readonly createTransferUseCase: CreateTransferUseCase,
    private readonly confirmTransferUseCase: ConfirmTransferUseCase,
    private readonly getTransferUseCase: GetTransferUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: "Enviar uma transferência" })
  @ApiCreatedResponse({ description: "Transferência criada", type: CreateTransferResponseDto })
  @ApiNotFoundResponse({ description: "Chave de destino não encontrada" })
  create(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreateTransferDto,
  ): Promise<CreateTransferResponseDto> {
    return this.createTransferUseCase.execute(request.user.pspId, dto);
  }

  @Patch("ack")
  @ApiOperation({ summary: "Confirmar uma transferência" })
  @ApiOkResponse({ description: "Transferência confirmada", type: SuccessResponseDto })
  @ApiNotFoundResponse({ description: "Transferência não encontrada" })
  @ApiForbiddenResponse({ description: "PSP sem permissão" })
  confirm(
    @Request() request: AuthenticatedRequest,
    @Body() dto: ConfirmTransferDto,
  ): Promise<SuccessResponseDto> {
    return this.confirmTransferUseCase.execute(request.user.pspId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Listar detalhes da transação" })
  @ApiParam({ name: "id", example: "12313" })
  @ApiOkResponse({ description: "Transferência encontrada", type: TransferResponseDto })
  @ApiNotFoundResponse({ description: "Transferência não encontrada" })
  @ApiForbiddenResponse({ description: "PSP sem permissão" })
  get(@Request() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.getTransferUseCase.execute(request.user.pspId, id);
  }
}
