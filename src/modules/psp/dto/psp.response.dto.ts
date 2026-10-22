import { ApiProperty } from "@nestjs/swagger";

export class PspResponseDto {
  @ApiProperty({ example: "121212" })
  id: string;

  @ApiProperty({ example: "PSP A" })
  name: string;

  @ApiProperty({ example: "212121" })
  document: string;
}
