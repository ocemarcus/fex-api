import { ApiProperty } from "@nestjs/swagger";

export class AuthResponseDto {
  @ApiProperty({ example: "xxxxx", description: "JWT token" })
  jwt: string;

  @ApiProperty({ example: 10000, description: "Tempo de expiração em segundos" })
  expireIn: number;
}
