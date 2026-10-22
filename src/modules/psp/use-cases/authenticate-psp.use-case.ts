import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { RsaService } from "../../../shared/crypto/rsa.service";
import { AuthenticatePspDto } from "../dto/authenticate-psp.dto";
import { AuthResponseDto } from "../dto/auth.response.dto";
import { PspApiKeyRepository } from "../repositories/psp-api-key.repository";

@Injectable()
export class AuthenticatePspUseCase {
  constructor(
    private readonly pspApiKeyRepository: PspApiKeyRepository,
    private readonly rsaService: RsaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: AuthenticatePspDto): Promise<AuthResponseDto> {
    const apiKeyRow = await this.pspApiKeyRepository.findByApiKey(dto.apiKey);
    if (!apiKeyRow?.pspId) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const storedPairValid = this.rsaService.isKeyPairValid(
      apiKeyRow.privateKey,
      apiKeyRow.publicKey,
    );
    const clientKeyValid = this.rsaService.isKeyPairValid(dto.privateKey, apiKeyRow.publicKey);

    if (!storedPairValid || !clientKeyValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const jwt = await this.jwtService.signAsync({ pspId: String(apiKeyRow.pspId) });
    const expireIn = Number(this.configService.get<string>("JWT_EXPIRES_IN"));

    return { jwt, expireIn };
  }
}
