import { define } from 'typeorm-seeding';
import { User } from '../users/entities/user.entity';

define(User, () => {
  const user = new User();
  user.name = 'Admin';
  user.email = 'admin@email.com';
  user.password = '@321Abc';
  user.role = 'ADMIN';
  user.salt = '';
  user.is_active = true;
  return user;
});
