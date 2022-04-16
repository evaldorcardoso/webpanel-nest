import { Exclude } from 'class-transformer';
import { User } from '../entities/user.entity';
import { UserRole } from '../user-roles.enum';

export class ReturnUserDto {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  confirmation_token: string;
  recover_token: string | null;
  uuid: string;
  created_at: Date;
  updated_at: Date;

  @Exclude()
  password: string;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
  }
}
