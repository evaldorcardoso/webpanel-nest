import { define } from 'typeorm-seeding';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

define(User, () => {
  const user = new User();
  user.name = 'Admin';
  user.email = 'admin@email.com';
  //wait a few seconds
  user.salt = bcrypt.genSaltSync();
  // user.salt = bcrypt.genSalt();
  //wait a few seconds
  user.password = bcrypt.hashSync('@321Abc', user.salt);
  // user.password = bcrypt.hash('@321Abc', user.salt);
  user.role = 'ADMIN';
  user.is_active = true;
  return user;
});
