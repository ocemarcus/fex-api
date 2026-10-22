import { Module } from "@nestjs/common";
import { PspController } from "./controllers/psp.controller";
import { PspApiKeyRepository } from "./repositories/psp-api-key.repository";
import { PspRepository } from "./repositories/psp.repository";
import { AuthenticatePspUseCase } from "./use-cases/authenticate-psp.use-case";
import { CreatePspApiKeyUseCase } from "./use-cases/create-psp-api-key.use-case";
import { CreatePspUseCase } from "./use-cases/create-psp.use-case";

@Module({
  controllers: [PspController],
  providers: [
    PspRepository,
    PspApiKeyRepository,
    CreatePspUseCase,
    CreatePspApiKeyUseCase,
    AuthenticatePspUseCase,
  ],
  exports: [PspRepository, PspApiKeyRepository],
})
export class PspModule {}
