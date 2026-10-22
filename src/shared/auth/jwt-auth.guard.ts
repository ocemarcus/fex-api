import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AuthenticatedRequest, JwtPayload } from "./types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Invalid JWT");
    }

    const token = authorization.slice("Bearer ".length);

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = { pspId: payload.pspId };
      return true;
    } catch (error: unknown) {
      throw new UnauthorizedException("Invalid JWT");
    }
  }
}
