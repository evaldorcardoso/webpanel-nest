import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { mailerConfig } from 'src/configs/mailer.config';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from 'src/users/repositories/users.repository';
import { UsersModule } from 'src/users/users.module';
import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UserRole } from 'src/users/user-roles.enum';
import { FinancialRepository } from 'src/financials/repositories/financial.repository';
import { Financial } from 'src/financials/entities/financial.entity';

const adminUser = {
  name: 'Admin',
  email: 'admin@email.com',
  password: '@321Abc',
};
let userRepository: UserRepository;
let jwtTokenAdmin: string;
let app: INestApplication;

async function createAndAuthenticateAdmin(): Promise<string> {
  const userAdmin = await userRepository.createUser(
    {
      name: adminUser.name,
      email: adminUser.email,
      password: adminUser.password,
      password_confirmation: adminUser.password,
    },
    UserRole.ADMIN,
  );

  await userRepository.update(userAdmin.id, {
    is_active: true,
  });

  const response = await request(app.getHttpServer())
    .post('/auth/signin')
    .send({ email: adminUser.email, password: adminUser.password })
    .expect(200);

  return response.body.token;
}

beforeAll(async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      MailerModule.forRoot(mailerConfig),
      UsersModule,
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [User, Company, Financial],
        logging: false,
        synchronize: true,
      }),
      TypeOrmModule.forFeature([UserRepository, FinancialRepository]),
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

describe('Authenticate users', () => {
  it('should be able to authenticate an Admin user /signin', async () => {
    const userAdmin = await userRepository.createUser(
      {
        name: adminUser.name,
        email: adminUser.email,
        password: adminUser.password,
        password_confirmation: adminUser.password,
      },
      UserRole.ADMIN,
    );

    await userRepository.update(userAdmin.id, {
      is_active: true,
    });

    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: adminUser.email, password: adminUser.password })
      .expect(200);

    jwtTokenAdmin = response.body.token;
    expect(jwtTokenAdmin).toMatch(
      /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
    );
  });

  it('should be able to authenticate a normal user /signin', async () => {
    const user = await userRepository.createUser(
      {
        name: adminUser.name,
        email: adminUser.email,
        password: adminUser.password,
        password_confirmation: adminUser.password,
      },
      UserRole.USER,
    );

    await userRepository.update(user.id, {
      is_active: true,
    });

    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: adminUser.email, password: adminUser.password })
      .expect(200);

    const jwtToken = response.body.token;
    expect(jwtToken).toMatch(
      /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
    );
  });

  it('should not be able to authenticate a normal user with invalid credentials /signin', async () => {
    const user = await userRepository.createUser(
      {
        name: adminUser.name,
        email: adminUser.email,
        password: adminUser.password,
        password_confirmation: adminUser.password,
      },
      UserRole.USER,
    );

    await userRepository.update(user.id, {
      is_active: true,
    });

    await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: adminUser.email, password: 'invalid-password' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should not be able to authenticate a normal user when is not active /signin', async () => {
    await userRepository.createUser(
      {
        name: adminUser.name,
        email: adminUser.email,
        password: adminUser.password,
        password_confirmation: adminUser.password,
      },
      UserRole.USER,
    );

    await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: adminUser.email, password: adminUser.password })
      .expect(HttpStatus.UNAUTHORIZED);
  });
});

describe('Auth Flow', () => {
  it('should be able to register a normal user /signup', async () => {
    jwtTokenAdmin = await createAndAuthenticateAdmin();
    const user = {
      email: 'user@email.com.br',
      name: 'User',
      password: adminUser.password,
      password_confirmation: adminUser.password,
    };
    await request(app.getHttpServer())
      .post('/auth/signup')
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send(user)
      .expect(HttpStatus.CREATED);

    const userAfter = await userRepository.findOne({
      where: {
        email: user.email,
      },
    });
    expect(userAfter).toMatchObject({
      email: user.email,
      name: user.name,
      role: UserRole.USER,
      is_active: false,
    });
  });

  it('should not be able to register a normal user with different passwords /signup', async () => {
    jwtTokenAdmin = await createAndAuthenticateAdmin();
    const user = {
      email: 'user@email.com.br',
      name: 'User',
      password: adminUser.password,
      password_confirmation: adminUser.password + '*',
    };
    await request(app.getHttpServer())
      .post('/auth/signup')
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send(user)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    const userAfter = await userRepository.findOne({
      where: {
        email: user.email,
      },
    });
    expect(userAfter).toBeUndefined();
  });

  it('should be able to activate a normal user with given token /auth', async () => {
    jwtTokenAdmin = await createAndAuthenticateAdmin();
    const user = {
      email: 'user@email.com.br',
      name: 'User',
      password: adminUser.password,
      password_confirmation: adminUser.password,
    };
    await request(app.getHttpServer())
      .post('/auth/signup')
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send(user)
      .expect(HttpStatus.CREATED);

    let userAfter = await userRepository.findOne({
      where: {
        email: user.email,
      },
    });
    expect(userAfter).toMatchObject({
      email: user.email,
      name: user.name,
      role: UserRole.USER,
      is_active: false,
    });

    await request(app.getHttpServer())
      .get(`/auth/${userAfter.confirmation_token}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.OK);

    userAfter = await userRepository.findOne({
      where: {
        email: user.email,
      },
    });
    expect(userAfter).toMatchObject({
      email: user.email,
      name: user.name,
      role: UserRole.USER,
      is_active: true,
    });
  });

  it('should not be able to activate a normal user with invalid token /auth', async () => {
    jwtTokenAdmin = await createAndAuthenticateAdmin();
    const user = {
      email: 'user@email.com.br',
      name: 'User',
      password: adminUser.password,
      password_confirmation: adminUser.password,
    };
    await request(app.getHttpServer())
      .post('/auth/signup')
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send(user)
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .patch(`/auth/invalid-token`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.NOT_FOUND);
  });

  it('should be able to send a recover email and reset password /send-recover-email, /reset-password', async () => {
    const userData = {
      email: 'user@email.com.br',
      name: 'User',
      password: adminUser.password,
      password_confirmation: adminUser.password,
    };
    let user = await userRepository.createUser(userData, UserRole.USER);

    await request(app.getHttpServer())
      .post('/auth/send-recover-email')
      .accept('application/json')
      .send({ email: user.email })
      .expect(HttpStatus.OK);

    user = await userRepository.findOne(user.id);

    await request(app.getHttpServer())
      .patch(`/auth/reset-password/${user.recover_token}`)
      .accept('application/json')
      .send({
        password: userData.password + '*',
        password_confirmation: userData.password_confirmation + '*',
      })
      .expect(HttpStatus.OK);
  });

  it('should not be able to send a recover email and reset password with different passwords /send-recover-email, /reset-password', async () => {
    const userData = {
      email: 'user@email.com.br',
      name: 'User',
      password: adminUser.password,
      password_confirmation: adminUser.password,
    };
    let user = await userRepository.createUser(userData, UserRole.USER);

    await request(app.getHttpServer())
      .post('/auth/send-recover-email')
      .accept('application/json')
      .send({ email: user.email })
      .expect(HttpStatus.OK);

    user = await userRepository.findOne(user.id);

    await request(app.getHttpServer())
      .patch(`/auth/reset-password/${user.recover_token}`)
      .accept('application/json')
      .send({
        password: userData.password + '*',
        password_confirmation: userData.password_confirmation + '#',
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('should not be able to send a recover email to invalid user /send-recover-email', async () => {
    const userData = {
      email: 'user@email.com.br',
      name: 'User',
      password: adminUser.password,
      password_confirmation: adminUser.password,
    };
    await userRepository.createUser(userData, UserRole.USER);

    await request(app.getHttpServer())
      .post('/auth/send-recover-email')
      .accept('application/json')
      .send({ email: 'invalid-user@email.com' })
      .expect(HttpStatus.NOT_FOUND);
  });

  it('should not be able to reset password with invalid token /reset-password', async () => {
    const userData = {
      email: 'user@email.com.br',
      name: 'User',
      password: adminUser.password,
      password_confirmation: adminUser.password,
    };
    await userRepository.createUser(userData, UserRole.USER);

    await request(app.getHttpServer())
      .patch(`/auth/reset-password/invalid-token`)
      .accept('application/json')
      .send({
        password: userData.password + '*',
        password_confirmation: userData.password_confirmation + '*',
      })
      .expect(HttpStatus.NOT_FOUND);
  });

  it('should be able to change password of a logged user /change-password', async () => {
    jwtTokenAdmin = await createAndAuthenticateAdmin();

    const userAdmin = await userRepository.findOne({ email: adminUser.email });

    await request(app.getHttpServer())
      .patch(`/auth/${userAdmin.uuid}/change-password`)
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send({
        password: adminUser.password + '*',
        password_confirmation: adminUser.password + '*',
      })
      .expect(HttpStatus.OK);
  });

  it('should not be able to change password of a logged user with different passwords /change-password', async () => {
    jwtTokenAdmin = await createAndAuthenticateAdmin();

    const userAdmin = await userRepository.findOne({ email: adminUser.email });

    await request(app.getHttpServer())
      .patch(`/auth/${userAdmin.uuid}/change-password`)
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send({
        password: adminUser.password + '*',
        password_confirmation: adminUser.password + '#',
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('should not be able to a normal logged user change password of another user /change-password', async () => {
    const userData = {
      email: 'user@email.com.br',
      name: 'User',
      password: adminUser.password,
      password_confirmation: adminUser.password,
    };
    const user = await userRepository.createUser(userData, UserRole.USER);
    await userRepository.update(user.id, {
      is_active: true,
    });

    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: userData.email, password: userData.password })
      .expect(HttpStatus.OK);
    const jwtToken = response.body.token;

    const anotherUserData = {
      email: 'user2@email.com.br',
      name: 'User 2',
      password: adminUser.password,
      password_confirmation: adminUser.password,
    };
    const anotherUser = await userRepository.createUser(
      anotherUserData,
      UserRole.USER,
    );

    await request(app.getHttpServer())
      .patch(`/auth/${anotherUser.uuid}/change-password`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send({
        password: userData.password + '*',
        password_confirmation: userData.password + '*',
      })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should be able to get the logged user /me', async () => {
    jwtTokenAdmin = await createAndAuthenticateAdmin();

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${jwtTokenAdmin}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body).toMatchObject({
          email: adminUser.email,
          name: adminUser.name,
          role: 'ADMIN',
        });
      });
  });
});
