import { ApiProperty } from "@nestjs/swagger";

export class CreateTransferResponseDto {
  @ApiProperty({ example: "111111" })
  id: string;

  @ApiProperty({ example: "1000", description: "Valor em precisão decimal" })
  amount: number;

  @ApiProperty({ example: "+55223345432133", description: "Chave de destino" })
  key: string;
}
