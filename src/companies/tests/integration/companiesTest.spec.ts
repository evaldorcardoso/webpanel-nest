import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from 'src/users/repositories/users.repository';
import { UserRole } from 'src/users/user-roles.enum';
import { UsersModule } from 'src/users/users.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from 'src/configs/mailer.config';
import * as request from 'supertest';
import { CompaniesModule } from 'src/companies/companies.module';
import { CompanyRepository } from 'src/companies/repositories/companies.repository';
import { Company } from 'src/companies/entities/company.entity';
import { FindCompaniesQueryDto } from 'src/companies/dto/find-companies-query.dto';

const DEFAULT_PASSWORD = '@321Abc';
interface UserDto {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

let companyRepository: CompanyRepository;
let userRepository: UserRepository;
let jwtToken: string;
let app: INestApplication;

async function createAndAuthenticateUser(
  role: UserRole,
  userData?: UserDto,
): Promise<string> {
  const user = await createUser(role, true, userData);

  return await authenticateUser(
    user.email,
    userData ? userData.password : DEFAULT_PASSWORD,
  );
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

async function authenticateUser(
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/signin')
    .send({
      email,
      password,
    })
    .expect(201);

  return response.body.token;
}

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      MailerModule.forRoot(mailerConfig),
      CompaniesModule,
      UsersModule,
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [User, Company],
        synchronize: true,
        logging: false,
      }),
      TypeOrmModule.forFeature([UserRepository, CompanyRepository]),
      AuthModule,
    ],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();
  companyRepository = moduleFixture.get(CompanyRepository);
  userRepository = moduleFixture.get(UserRepository);
});

afterAll(async () => {
  await app.close();
});

afterEach(async () => {
  await companyRepository.clear();
  await userRepository.clear();
});

describe('Companies CRUD', () => {
  it('should be able to create a Company with an authenticated admin user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);

    await request(app.getHttpServer())
      .post('/companies')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Company 1',
      })
      .expect(HttpStatus.CREATED);
  });

  it('should not be able to create a Company with same name', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      where: {
        email: 'admin@email.com',
      },
    });
    const company = await companyRepository.createCompany(user.id, {
      name: 'Company 1',
    });

    await request(app.getHttpServer())
      .post('/companies')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: company.name,
      })
      .expect(HttpStatus.CONFLICT);
  });

  it('should not be able to create a Company with an authenticated normal user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.USER);

    await request(app.getHttpServer())
      .post('/companies')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Company 1',
      })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should not be able to create a Company without authentication', async () => {
    await request(app.getHttpServer())
      .post('/companies')
      .send({
        name: 'Company 1',
      })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should be able to get a company by uuid with an authenticated admin user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      where: {
        email: 'admin@email.com',
      },
    });
    const company = await companyRepository.createCompany(user.id, {
      name: 'Company 1',
    });
    await companyRepository.createCompany(user.id, {
      name: 'Company 2',
    });

    await request(app.getHttpServer())
      .get(`/companies/${company.uuid}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.name).toBe('Company 1');
      });
  });

  it('should be able to link a company to another user with an authenticated admin user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      where: {
        email: 'admin@email.com',
      },
    });
    await companyRepository.createCompany(user.id, {
      name: 'Company 1',
    });

    const anotherCompany = await companyRepository.createCompany(user.id, {
      name: 'Company 2',
    });

    const anotherUser = await createUser(UserRole.USER);
    const jwtTokenUser = await authenticateUser(
      anotherUser.email,
      DEFAULT_PASSWORD,
    );

    await request(app.getHttpServer())
      .get('/companies/me')
      .set('Authorization', `Bearer ${jwtTokenUser}`)
      .accept('application/json')
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.found.companies.length).toBe(0);
      });

    await request(app.getHttpServer())
      .get(`/companies/${anotherCompany.uuid}/users/${anotherUser.uuid}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.company.name).toBe(anotherCompany.name);
      });

    await request(app.getHttpServer())
      .get('/companies/me')
      .set('Authorization', `Bearer ${jwtTokenUser}`)
      .accept('application/json')
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.found.companies.length).toBe(1);
        expect(res.body.found.companies[0].name).toBe(anotherCompany.name);
      });
  });

  it('should be able to get a list of companies linked to the logged user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      where: {
        email: 'admin@email.com',
      },
    });
    const anotherUser = await createUser(UserRole.USER);

    const company = await companyRepository.createCompany(user.id, {
      name: 'Company 1',
    });

    await companyRepository.createCompany(anotherUser.id, {
      name: 'Company 2',
    });

    const anotherCompany2 = await companyRepository.createCompany(user.id, {
      name: 'Company 3',
    });

    await request(app.getHttpServer())
      .get('/companies/me')
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.found.companies.length).toBe(2);
        expect(res.body.found.companies[0].name).toBe(company.name);
        expect(res.body.found.companies[1].name).toBe(anotherCompany2.name);
      });
  });

  it('should not be able to get a company by uuid with an invalid uuid', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      where: {
        email: 'admin@email.com',
      },
    });
    await companyRepository.createCompany(user.id, {
      name: 'Company 1',
    });

    await request(app.getHttpServer())
      .get(`/companies/1234567890`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .expect(HttpStatus.NOT_FOUND);
  });

  it('should be able to find a company by name with an authenticated admin user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      where: {
        email: 'admin@email.com',
      },
    });
    await companyRepository.createCompany(user.id, {
      name: 'Company1',
    });
    await companyRepository.createCompany(user.id, {
      name: 'Company 2',
    });

    await request(app.getHttpServer())
      .get(`/companies?name=Company 2`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.found.companies[0].name).toBe('Company 2');
      });
  });

  it('should be able to update a company with an authenticated admin user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      where: {
        email: 'admin@email.com',
      },
    });
    const company = await companyRepository.createCompany(user.id, {
      name: 'Company 1',
    });

    await request(app.getHttpServer())
      .patch(`/companies/${company.uuid}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send({ name: 'Company Altered' })
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.name).toBe('Company Altered');
      });
  });

  it('should not be able to update a company with an authenticated normal user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.USER);
    const user = await userRepository.findOne({
      where: {
        email: 'user@email.com',
      },
    });
    const company = await companyRepository.createCompany(user.id, {
      name: 'Company 1',
    });

    await request(app.getHttpServer())
      .patch(`/companies/${company.uuid}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send({ name: 'Company Altered' })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should not be able to update a company with an invalid uuid', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      where: {
        email: 'admin@email.com',
      },
    });
    await companyRepository.createCompany(user.id, {
      name: 'Company 1',
    });

    await request(app.getHttpServer())
      .patch(`/companies/1234567890`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send({ name: 'Company Altered' })
      .expect(HttpStatus.NOT_FOUND);
  });

  it('should be able to delete a company with an authenticated admin user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      where: {
        email: 'admin@email.com',
      },
    });
    let company = await companyRepository.createCompany(user.id, {
      name: 'Company 1',
    });

    await request(app.getHttpServer())
      .delete(`/companies/${company.uuid}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.OK);

    company = await companyRepository.findOne(company.id);
    expect(company).toBeUndefined();
  });

  it('should not be able to delete a company with an invalid uuid', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      where: {
        email: 'admin@email.com',
      },
    });
    let company = await companyRepository.createCompany(user.id, {
      name: 'Company 1',
    });

    await request(app.getHttpServer())
      .delete(`/companies/1234567890`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.NOT_FOUND);

    company = await companyRepository.findOne(company.id);
    expect(company).toBeTruthy();
  });

  it('should not be able to delete a company with an authenticated normal user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.USER);
    const user = await userRepository.findOne({
      where: {
        email: 'user@email.com',
      },
    });
    let company = await companyRepository.createCompany(user.id, {
      name: 'Company 1',
    });

    await request(app.getHttpServer())
      .delete(`/companies/${company.uuid}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.FORBIDDEN);

    company = await companyRepository.findOne(company.id);
    expect(company).toBeTruthy();
  });
});
