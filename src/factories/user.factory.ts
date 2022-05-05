import { define } from 'typeorm-seeding';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/user-roles.enum';

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
