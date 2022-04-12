import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from 'src/users/repositories/users.repository';
import { UserRole } from 'src/users/user-roles.enum';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from 'src/configs/mailer.config';
import * as request from 'supertest';

describe('UserController (e2e)', () => {
  let userService: UsersService;
  let userRepository: UserRepository;
  let jwtTokenAdmin: string;
  let jwtTokenUser: string;
  let app: INestApplication;
  const NAME = 'NAME';
  const EMAIL = 'admin@email.com';
  const PASSWORD = '@321Abc';

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
    userService = new UsersService(userRepository);
  });

  afterAll(async () => {
    await userRepository.query('DELETE FROM user');
    await app.close();
  });

  afterEach(async () => {
    // await userRepository.query('DELETE FROM user');
  });

  describe('Authenticate users', () => {
    it('should be able to authenticate an Admin user', async () => {
      const userAdmin = await userService.createAdminUser({
        name: NAME,
        email: EMAIL,
        password: PASSWORD,
        passwordConfirmation: PASSWORD,
      });

      await userRepository.update(userAdmin.id, {
        is_active: true,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: EMAIL, password: PASSWORD })
        .expect(201);

      jwtTokenAdmin = response.body.token;
      expect(jwtTokenAdmin).toMatch(
        /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
      );
    });

    it('should be able to authenticate an normal user', async () => {
      const userUser = await userRepository.createUser(
        {
          name: NAME,
          email: 'user@email.com',
          password: PASSWORD,
          passwordConfirmation: PASSWORD,
        },
        UserRole.USER,
      );

      await userRepository.update(userUser.id, {
        is_active: true,
      });

      const responseUser = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: 'user@email.com', password: PASSWORD })
        .expect(201);

      jwtTokenUser = responseUser.body.token;
      expect(jwtTokenUser).toMatch(
        /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
      );
    });
  });

  describe('Users CRUD', () => {
    it('should be able to create an admin user with an authenticated admin user', async () => {
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

    it('should be able to get a user by uuid with an authenticated admin user', async () => {
      const user = await userRepository.findOne({ email: 'admin@email.com' });

      await request(app.getHttpServer())
        .get(`/users/${user.uuid}`)
        .set('Authorization', `Bearer ${jwtTokenAdmin}`)
        .accept('application/json')
        .send()
        .expect(HttpStatus.OK)
        .then((res) => {
          expect(res.body.user).toMatchObject({
            email: 'admin@email.com',
            name: 'NAME',
            role: 'ADMIN',
            uuid: user.uuid,
          });
        });
    });

    it('should be able to get a list of users with an authenticated admin user', async () => {
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
            email: 'user@email.com',
          });
        });
    });

    it('should be able to update an admin user with an authenticated admin user', async () => {
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

    it('should be able to delete a user by uuid with an authenticated admin user', async () => {
      const user = await userRepository.findOne({ email: 'user@email.com' });

      await request(app.getHttpServer())
        .delete(`/users/${user.uuid}`)
        .set('Authorization', `Bearer ${jwtTokenAdmin}`)
        .accept('application/json')
        .send()
        .expect(HttpStatus.OK);
    });
  });
});
