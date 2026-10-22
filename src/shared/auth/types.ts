import type { Request } from "express";

export interface JwtPayload {
  pspId: string;
}

export interface AuthenticatedUser {
  pspId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
