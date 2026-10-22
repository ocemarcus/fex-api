import { Body, Controller, Post } from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthenticatePspDto } from "../dto/authenticate-psp.dto";
import { AuthResponseDto } from "../dto/auth.response.dto";
import { CreatePspApiKeyDto } from "../dto/create-psp-api-key.dto";
import { CreatePspApiKeyResponseDto } from "../dto/create-psp-api-key.response.dto";
import { CreatePspDto } from "../dto/create-psp.dto";
import { PspResponseDto } from "../dto/psp.response.dto";
import { AuthenticatePspUseCase } from "../use-cases/authenticate-psp.use-case";
import { CreatePspApiKeyUseCase } from "../use-cases/create-psp-api-key.use-case";
import { CreatePspUseCase } from "../use-cases/create-psp.use-case";

@ApiTags("PSP")
@Controller("/api/psp")
export class PspController {
  constructor(
    private readonly createPspUseCase: CreatePspUseCase,
    private readonly createPspApiKeyUseCase: CreatePspApiKeyUseCase,
    private readonly authenticatePspUseCase: AuthenticatePspUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: "Criar novo PSP" })
  @ApiCreatedResponse({ description: "PSP criado com sucesso", type: PspResponseDto })
  @ApiConflictResponse({ description: "Documento duplicado" })
  create(@Body() dto: CreatePspDto): Promise<PspResponseDto> {
    return this.createPspUseCase.execute(dto);
  }

  @Post("api-key")
  @ApiOperation({ summary: "Criar chaves para API" })
  @ApiCreatedResponse({ description: "API Key criada", type: CreatePspApiKeyResponseDto })
  @ApiNotFoundResponse({ description: "PSP não encontrado" })
  createApiKey(@Body() dto: CreatePspApiKeyDto): Promise<CreatePspApiKeyResponseDto> {
    return this.createPspApiKeyUseCase.execute(dto);
  }

  @Post("auth")
  @ApiOperation({ summary: "Autenticar PSP" })
  @ApiOkResponse({ description: "JWT gerado com sucesso", type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: "Credenciais inválidas" })
  authenticate(@Body() dto: AuthenticatePspDto): Promise<AuthResponseDto> {
    return this.authenticatePspUseCase.execute(dto);
  }
}
