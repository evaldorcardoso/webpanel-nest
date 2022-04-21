import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { UserRole } from '../user-roles.enum';

export class ReturnUserDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ default: false })
  is_active: boolean;

  constructor(user: User) {
    this.uuid = user.uuid;
    this.email = user.email;
    this.name = user.name;
    this.role = UserRole[user.role];
    this.is_active = user.is_active;
  }
}
