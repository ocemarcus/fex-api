import { Body, Controller, Get, Param, Post, Request, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../../../shared/auth/types";
import { JwtAuthGuard } from "../../../shared/auth/jwt-auth.guard";
import { CreatePspKeyDto } from "../dto/create-psp-key.dto";
import { CreatePspKeyResponseDto } from "../dto/create-psp-key.response.dto";
import { PspKeyResponseDto } from "../dto/psp-key.response.dto";
import { CreatePspKeyUseCase } from "../use-cases/create-psp-key.use-case";
import { GetPspKeyUseCase } from "../use-cases/get-psp-key.use-case";

@ApiTags("PSP Keys")
@ApiBearerAuth()
@Controller("/api/psp/key")
@UseGuards(JwtAuthGuard)
export class PspKeyController {
  constructor(
    private readonly createPspKeyUseCase: CreatePspKeyUseCase,
    private readonly getPspKeyUseCase: GetPspKeyUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: "Criar uma chave para cliente do PSP" })
  @ApiCreatedResponse({ description: "Chave criada", type: CreatePspKeyResponseDto })
  @ApiConflictResponse({ description: "Chave duplicada" })
  create(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreatePspKeyDto,
  ): Promise<CreatePspKeyResponseDto> {
    return this.createPspKeyUseCase.execute(request.user.pspId, dto);
  }

  @Get(":key")
  @ApiOperation({ summary: "Listar informações da chave do cliente" })
  @ApiParam({ name: "key", example: "+55223345432133" })
  @ApiOkResponse({ description: "Chave encontrada", type: PspKeyResponseDto })
  @ApiNotFoundResponse({ description: "Chave não encontrada" })
  @ApiForbiddenResponse({ description: "PSP sem permissão" })
  get(
    @Request() request: AuthenticatedRequest,
    @Param("key") key: string,
  ): Promise<PspKeyResponseDto> {
    return this.getPspKeyUseCase.execute(request.user.pspId, key);
  }
}
