import { MailerModule } from '@nestjs-modules/mailer';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { CompaniesModule } from '../src/companies/companies.module';
import { Company } from '../src/companies/company.entity';
import { CompanyRepository } from '../src/companies/companies.repository';
import { mailerConfig } from '../src/configs/mailer.config';
import { FinancialDetail } from '../src/financial-details/financial-detail.entity';
import { FinancialDetailRepository } from '../src/financial-details/financial-detail.repository';
import { Financial } from '../src/financials/entities/financial.entity';
import { FinancialsModule } from '../src/financials/financials.module';
import { FinancialRepository } from '../src/financials/repositories/financial.repository';
import { User } from '../src/users/user.entity';
import { UserRepository } from '../src/users/users.repository';
import { UserRole } from '../src/users/user-roles.enum';
import { UsersModule } from '../src/users/users.module';
import * as request from 'supertest';

const DEFAULT_PASSWORD = '@321Abc';
interface UserDto {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

let financialRepository: FinancialRepository;
let financialDetailRepository: FinancialDetailRepository;
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
        password_confirmation: DEFAULT_PASSWORD,
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
    .expect(200);

  return response.body.token;
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
        entities: [User, Company, Financial, FinancialDetail],
        synchronize: true,
        logging: false,
      }),
      TypeOrmModule.forFeature([
        UserRepository,
        CompanyRepository,
        FinancialRepository,
        FinancialDetailRepository,
      ]),
      AuthModule,
      CompaniesModule,
      FinancialsModule,
    ],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();
  companyRepository = moduleFixture.get(CompanyRepository);
  financialRepository = moduleFixture.get(FinancialRepository);
  financialDetailRepository = moduleFixture.get(FinancialDetailRepository);
  userRepository = moduleFixture.get(UserRepository);
});

afterAll(async () => {
  await app.close();
});

afterEach(async () => {
  await financialRepository.clear();
  await financialDetailRepository.clear();
  await companyRepository.clear();
  await userRepository.clear();
});

describe('Financials CRUD', () => {
  it('should be able to create a Financial Detail to the linked company', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.USER);
    const user = await userRepository.findOne({
      email: 'user@email.com',
    });

    const company = await companyRepository.createCompany(user.id, {
      name: 'Company',
    });

    const financial = await financialRepository.createFinancial(user.id, {
      company: company.uuid,
    });

    await request(app.getHttpServer())
      .post('/financials' + '/' + financial.uuid + '/details')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        value: 100,
      })
      .expect(HttpStatus.CREATED);
  });

  it('should be able to delete a Financial Detail to the linked company', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      email: 'admin@email.com',
    });

    const company = await companyRepository.createCompany(user.id, {
      name: 'Company',
    });

    const financial = await financialRepository.createFinancial(user.id, {
      company: company.uuid,
    });

    const financialDetail =
      await financialDetailRepository.createFinancialDetail(financial.id, {
        value: 100,
      });

    await request(app.getHttpServer())
      .delete(
        '/financials' +
          '/' +
          financial.uuid +
          '/details/' +
          financialDetail.uuid,
      )
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(HttpStatus.OK);
  });
});
