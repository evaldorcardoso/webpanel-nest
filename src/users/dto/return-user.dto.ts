import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class ReturnUserDto {
  @ApiProperty({ type: UserDto, isArray: true })
  @AutoMap()
  users: UserDto[];

  @ApiProperty({ default: 1 })
  @AutoMap()
  total: number;
}
