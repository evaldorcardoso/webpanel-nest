import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { mailerConfig } from 'src/configs/mailer.config';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from 'src/users/repositories/users.repository';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { FindUsersQueryDto } from 'src/users/dto/find-users-query.dto';
import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UserRole } from 'src/users/user-roles.enum';

const adminUser = {
  name: 'Admin',
  email: 'admin@email.com',
  password: '@321Abc',
};
let userRepository: UserRepository;
let authService: AuthService;
let app: INestApplication;
let jwtTokenAdmin: string;

async function createAndAuthenticateAdmin(): Promise<string> {
  const userAdmin = await userRepository.createUser(
    {
      name: adminUser.name,
      email: adminUser.email,
      password: adminUser.password,
      passwordConfirmation: adminUser.password,
    },
    UserRole.ADMIN,
  );

  await userRepository.update(userAdmin.id, {
    is_active: true,
  });

  const response = await request(app.getHttpServer())
    .post('/auth/signin')
    .send({ email: adminUser.email, password: adminUser.password })
    .expect(201);

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
        entities: [User, Company],
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
  authService = moduleFixture.get(AuthService);

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
        passwordConfirmation: adminUser.password,
      },
      UserRole.ADMIN,
    );

    await userRepository.update(userAdmin.id, {
      is_active: true,
    });

    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: adminUser.email, password: adminUser.password })
      .expect(201);

    jwtTokenAdmin = response.body.token;
    expect(jwtTokenAdmin).toMatch(
      /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
    );
  });
});

describe('Auth Flow', () => {
  it('should be able to register a normal user /signup', async () => {
    jwtTokenAdmin = await createAndAuthenticateAdmin();
    const user = {
      email: 'user@email.com.br',
      name: 'User',
      password: adminUser.password,
      passwordConfirmation: adminUser.password,
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

  it('should be able to activate a normal user /auth', async () => {
    jwtTokenAdmin = await createAndAuthenticateAdmin();
    const user = {
      email: 'user@email.com.br',
      name: 'User',
      password: adminUser.password,
      passwordConfirmation: adminUser.password,
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
      .patch(`/auth/${userAfter.confirmation_token}`)
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
});
