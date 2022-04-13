import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from 'src/users/repositories/users.repository';
import { UserRole } from 'src/users/user-roles.enum';
import { UsersModule } from 'src/users/users.module';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { mailerConfig } from 'src/configs/mailer.config';
import * as request from 'supertest';

const DEFAULT_PASSWORD = '@321Abc';
interface UserDto {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

let userRepository: UserRepository;
let jwtTokenAdmin: string;
let app: INestApplication;

async function createAndAuthenticateUser(
  role: UserRole,
  userData?: UserDto,
): Promise<string> {
  const user = await createUser(role, true, userData);

  const response = await request(app.getHttpServer())
    .post('/auth/signin')
    .send({
      email: user.email,
      password: userData ? userData.password : DEFAULT_PASSWORD,
    })
    .expect(201);

  return response.body.token;
}

async function createUser(
  role: UserRole,
  is_active = true,
  userData?: UserDto,
): Promise<User> {
  userData = userData
    ? userData
    : {
        name: '',
        email: '',
        password: DEFAULT_PASSWORD,
        passwordConfirmation: DEFAULT_PASSWORD,
      };

  if (role === UserRole.ADMIN) {
    userData.email = userData.email ? userData.email : 'admin@email.com';
    userData.name = userData.name ? userData.name : 'ADMIN';
  } else if (role === UserRole.USER) {
    userData.email = userData.email ? userData.email : 'user@email.com';
    userData.name = userData.name ? userData.name : 'USER';
  }

  const user = await userRepository.createUser(userData, role);

  if (is_active) {
    await userRepository.update(user.id, {
      is_active: true,
    });
  }

  return await userRepository.findOne(user.id);
}

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      MailerModule.forRoot(mailerConfig),
      UsersModule,
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [User],
        logging: false,
        synchronize: true,
      }),
      TypeOrmModule.forFeature([UserRepository]),
      AuthModule,
    ],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();
  userRepository = moduleFixture.get(UserRepository);

  jest
    .spyOn(MailerService.prototype, 'sendMail')
    .mockImplementation(() => Promise.resolve());
});

afterAll(async () => {
  await app.close();
});

afterEach(async () => {
  await userRepository.query('DELETE FROM user');
});

describe('Users CRUD', () => {
  it('should be able to create an admin user with an authenticated admin user', async () => {
    jwtTokenAdmin = await createAndAuthenticateUser(UserRole.ADMIN);
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send({
        email: 'admin2@admin.com.br',
        name: 'Admin',
        password: '@321Abc',
        passwordConfirmation: '@321Abc',
      })
      .expect(HttpStatus.CREATED);
  });

  it('should not be able to create an admin user with same email and an authenticated admin user', async () => {
    jwtTokenAdmin = await createAndAuthenticateUser(UserRole.ADMIN);
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send({
        email: 'admin@email.com',
        name: 'Admin',
        password: DEFAULT_PASSWORD,
        passwordConfirmation: DEFAULT_PASSWORD,
      })
      .expect(HttpStatus.CONFLICT);
  });

  it('should not be able to create an admin user without authentication', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .accept('application/json')
      .send({
        email: 'admin2@admin.com.br',
        name: 'Admin',
        password: '@321Abc',
        passwordConfirmation: '@321Abc',
      })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should be able to get another user by uuid with an authenticated admin user', async () => {
    jwtTokenAdmin = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await createUser(UserRole.USER);

    await request(app.getHttpServer())
      .get(`/users/${user.uuid}`)
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.user).toMatchObject({
          email: user.email,
          name: user.name,
          role: user.role,
          uuid: user.uuid,
        });
      });
  });

  it('should be able to get a list of users with an authenticated admin user', async () => {
    jwtTokenAdmin = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await createUser(UserRole.USER);

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.users).toHaveLength(2);
        expect(res.body.total).toBe(2);
        expect(res.body.users[0]).toMatchObject({
          email: 'admin@email.com',
        });
        expect(res.body.users[1]).toMatchObject({
          email: user.email,
        });
      });
  });

  it('should be able to find users by email with an authenticated admin user', async () => {
    jwtTokenAdmin = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await createUser(UserRole.USER);

    await request(app.getHttpServer())
      .get(`/users?email=${user.email}`)
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.users).toHaveLength(1);
        expect(res.body.total).toBe(1);
        expect(res.body.users[0]).toMatchObject({
          email: user.email,
        });
      });
  });

  it('should be able to find users by name with an authenticated admin user', async () => {
    jwtTokenAdmin = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await createUser(UserRole.USER);

    await request(app.getHttpServer())
      .get(`/users?name=${user.name}`)
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.users).toHaveLength(1);
        expect(res.body.total).toBe(1);
        expect(res.body.users[0]).toMatchObject({
          name: user.name,
        });
      });
  });

  it('should be able to find users by role with an authenticated admin user', async () => {
    jwtTokenAdmin = await createAndAuthenticateUser(UserRole.ADMIN);
    await createUser(UserRole.USER);

    await request(app.getHttpServer())
      .get(`/users?role=${UserRole.ADMIN}`)
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.users).toHaveLength(1);
        expect(res.body.total).toBe(1);
        expect(res.body.users[0]).toMatchObject({
          email: 'admin@email.com',
        });
      });
  });

  it('should be able to update an admin user with an authenticated admin user', async () => {
    jwtTokenAdmin = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({ email: 'admin@email.com' });

    await request(app.getHttpServer())
      .patch(`/users/${user.uuid}`)
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send({
        name: 'Admin Alterado',
      })
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.name).toEqual('Admin Alterado');
      });
  });

  it('should not be able to update a user with another authenticated normal user', async () => {
    jwtTokenAdmin = await createAndAuthenticateUser(UserRole.USER);
    const user = await createUser(UserRole.USER, true, {
      email: 'user2@email.com',
      name: 'User 2',
      password: '@321Abc',
      passwordConfirmation: '@321Abc',
    });

    await request(app.getHttpServer())
      .patch(`/users/${user.uuid}`)
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send({
        name: 'User Alterado',
      })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should be able to delete another user by uuid with an authenticated admin user', async () => {
    jwtTokenAdmin = await createAndAuthenticateUser(UserRole.ADMIN);
    let user = await createUser(UserRole.USER);

    await request(app.getHttpServer())
      .delete(`/users/${user.uuid}`)
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.OK);

    user = await userRepository.findOne({ email: user.email });
    expect(user).toBeUndefined();
  });

  it('should not be able to delete another user by uuid with an authenticated normal user', async () => {
    jwtTokenAdmin = await createAndAuthenticateUser(UserRole.USER);
    let user = await createUser(UserRole.USER, true, {
      email: 'user2@email.com',
      name: 'User 2',
      password: '@321Abc',
      passwordConfirmation: '@321Abc',
    });

    await request(app.getHttpServer())
      .delete(`/users/${user.uuid}`)
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.FORBIDDEN);

    user = await userRepository.findOne({ email: user.email });
    expect(user).toBeTruthy();
  });
});
