import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user-roles.enum';

export class UserDto {
  @ApiProperty()
  @AutoMap()
  uuid: string;

  @ApiProperty()
  @AutoMap()
  email: string;

  @ApiProperty()
  @AutoMap()
  name: string;

  @ApiProperty({ enum: UserRole })
  @AutoMap()
  role: UserRole;

  @ApiProperty({ type: Boolean, default: false })
  @AutoMap()
  is_active: boolean;
}
