import { Controller, Get, Query, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../shared/auth/jwt-auth.guard";
import type { AuthenticatedRequest } from "../../../shared/auth/types";
import { ListTransfersDto } from "../dto/list-transfers.dto";
import { ListTransfersResponseDto } from "../dto/list-transfers.response.dto";
import { ListTransfersUseCase } from "../use-cases/list-transfers.use-case";

@ApiTags("Transfers")
@ApiBearerAuth()
@Controller("/api/transfer")
export class TransferListController {
  constructor(private readonly listTransfersUseCase: ListTransfersUseCase) {}

  @Get()
  @ApiOperation({ summary: "Listar transferências" })
  @ApiOkResponse({ description: "Lista de transferências", type: ListTransfersResponseDto })
  list(
    @Request() request: AuthenticatedRequest,
    @Query() dto: ListTransfersDto,
  ): Promise<ListTransfersResponseDto> {
    return this.listTransfersUseCase.execute(dto);
  }
}
