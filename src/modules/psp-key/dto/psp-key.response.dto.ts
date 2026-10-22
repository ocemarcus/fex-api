import { ApiProperty } from "@nestjs/swagger";

export class PspKeyOwnerDto {
  @ApiProperty({ example: "PSP B" })
  name: string;
}

export class PspKeyResponseDto {
  @ApiProperty({ example: "1313131" })
  id: string;

  @ApiProperty({ example: "+55223345432133" })
  key: string;

  @ApiProperty({ example: "Marcus" })
  name: string;

  @ApiProperty({ example: "22434332" })
  document: string;

  @ApiProperty({ type: PspKeyOwnerDto })
  psp: PspKeyOwnerDto;
}
