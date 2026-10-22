import { Module } from "@nestjs/common";
import { PspRepository } from "../psp/repositories/psp.repository";
import { PspKeyController } from "./controllers/psp-key.controller";
import { PspKeyRepository } from "./repositories/psp-key.repository";
import { CreatePspKeyUseCase } from "./use-cases/create-psp-key.use-case";
import { GetPspKeyUseCase } from "./use-cases/get-psp-key.use-case";

@Module({
  controllers: [PspKeyController],
  providers: [PspRepository, PspKeyRepository, CreatePspKeyUseCase, GetPspKeyUseCase],
  exports: [PspKeyRepository],
})
export class PspKeyModule {}
