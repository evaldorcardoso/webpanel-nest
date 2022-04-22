import { ApiProperty } from '@nestjs/swagger';

export class ReturnMessageDto {
  @ApiProperty()
  message: string;
}
