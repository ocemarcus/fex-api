import { ApiProperty } from "@nestjs/swagger";

export class CreatePspKeyResponseDto {
  @ApiProperty({ example: "213131" })
  id: string;

  @ApiProperty({ example: "+55223345432133" })
  key: string;

  @ApiProperty({ example: "Marcus" })
  name: string;

  @ApiProperty({ example: "22434332" })
  document: string;
}
