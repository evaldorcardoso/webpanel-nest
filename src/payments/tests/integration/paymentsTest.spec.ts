import { MailerModule } from '@nestjs-modules/mailer';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { mailerConfig } from 'src/configs/mailer.config';
import { FinancialDetail } from 'src/financial-details/financial-detail.entity';
import { FinancialDetailRepository } from 'src/financial-details/financial-detail.repository';
import { Financial } from 'src/financials/entities/financial.entity';
import { FinancialRepository } from 'src/financials/repositories/financial.repository';
import { Payment } from 'src/payments/entities/payment.entity';
import { PaymentsModule } from 'src/payments/payments.module';
import { PaymentRepository } from 'src/payments/repositories/payment.repository';
import { User } from 'src/users/user.entity';
import { UserRepository } from 'src/users/users.repository';
import { UserRole } from 'src/users/user-roles.enum';
import { UsersModule } from 'src/users/users.module';
import * as request from 'supertest';

const DEFAULT_PASSWORD = '@321Abc';
interface UserDto {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

let paymentRepository: PaymentRepository;
let userRepository: UserRepository;
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
        entities: [User, Financial, FinancialDetail, Payment],
        synchronize: true,
        logging: false,
      }),
      TypeOrmModule.forFeature([
        UserRepository,
        FinancialRepository,
        FinancialDetailRepository,
        PaymentRepository,
      ]),
      AuthModule,
      PaymentsModule,
    ],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();
  paymentRepository = moduleFixture.get(PaymentRepository);
  userRepository = moduleFixture.get(UserRepository);
});

afterAll(async () => {
  await app.close();
});

afterEach(async () => {
  await paymentRepository.clear();
  await userRepository.clear();
});

describe('Payment methods CRUD', () => {
  it('should be able to create a new payment method', async () => {
    const jwtToken = await createAndAuthenticateUser(UserRole.USER);

    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Test payment',
        type: 'credit_card',
      })
      .expect(HttpStatus.CREATED);
  });

  it('should not be able to create a new payment method without authentication', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .send({
        name: 'Test payment',
        type: 'credit_card',
      })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should be able to get a payment method by uuid', async () => {
    const jwtToken = await createAndAuthenticateUser(UserRole.USER);

    const payment = await paymentRepository.createPayment({
      name: 'Test payment',
      type: 'credit_card',
    });

    await request(app.getHttpServer())
      .get('/payments/' + payment.uuid)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.name).toBe('Test payment');
        expect(response.body.type).toBe('credit_card');
      });
  });

  it('should be able to find a payment method by name and type', async () => {
    const jwtToken = await createAndAuthenticateUser(UserRole.USER);

    await paymentRepository.createPayment({
      name: 'Test payment',
      type: 'credit_card',
    });

    await paymentRepository.createPayment({
      name: 'Test payment cash',
      type: 'cash',
    });

    await request(app.getHttpServer())
      .get('/payments?name=Test%20payment&type=credit_card')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.total).toBe(1);
        expect(response.body.payments[0].name).toBe('Test payment');
        expect(response.body.payments[0].type).toBe('credit_card');
        expect(response.body.payments.length).toBe(1);
      });
  });

  it('should be able to update a payment method', async () => {
    const jwtToken = await createAndAuthenticateUser(UserRole.USER);

    const payment = await paymentRepository.createPayment({
      name: 'Test payment',
      type: 'credit_card',
    });

    await request(app.getHttpServer())
      .patch('/payments/' + payment.uuid)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Test payment updated',
      })
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.name).toBe('Test payment updated');
        expect(response.body.type).toBe('credit_card');
      });
  });

  it('should be able to delete a payment method', async () => {
    const jwtToken = await createAndAuthenticateUser(UserRole.USER);

    const payment = await paymentRepository.createPayment({
      name: 'Test payment',
      type: 'credit_card',
    });

    await request(app.getHttpServer())
      .delete('/payments/' + payment.uuid)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(HttpStatus.OK);
  });
});
