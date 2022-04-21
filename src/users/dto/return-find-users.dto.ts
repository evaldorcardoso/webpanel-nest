import { ApiProperty } from '@nestjs/swagger';
import { ReturnUserDto } from './return-user.dto';

export class ReturnFindUsersDto {
  @ApiProperty({ type: ReturnUserDto, isArray: true })
  users: ReturnUserDto[];

  @ApiProperty({ default: 1 })
  total: number;
}
