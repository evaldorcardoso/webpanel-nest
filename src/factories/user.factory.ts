import { define } from 'typeorm-seeding';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/users/user-roles.enum';

define(User, () => {
  const user = new User();
  user.name = 'Admin';
  user.email = 'admin@email.com';
  user.salt = bcrypt.genSaltSync();
  user.password = bcrypt.hashSync('@321Abc', user.salt);
  user.role = UserRole.ADMIN;
  user.is_active = true;
  return user;
});
