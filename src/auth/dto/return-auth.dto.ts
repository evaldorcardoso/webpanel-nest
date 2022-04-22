import { ApiProperty } from '@nestjs/swagger';

export class ReturnAuthDto {
  @ApiProperty()
  token: string;
}
