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
import { Financial } from 'src/financials/entities/financial.entity';
import { FinancialRepository } from 'src/financials/repositories/financial.repository';
import { FinancialDetail } from 'src/financial-details/entities/financial-detail.entity';
import { FinancialDetailRepository } from 'src/financial-details/repositories/financial-detail.repository';
import { ItemRepository } from 'src/items/repositories/items.repository';
import { ItemsModule } from 'src/items/items.module';
import { Item } from 'src/items/entities/item.entity';

const DEFAULT_PASSWORD = '@321Abc';
interface UserDto {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

let itemRepository: ItemRepository;
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
      ItemsModule,
      UsersModule,
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [User, Item, Financial, FinancialDetail],
        synchronize: true,
        logging: false,
      }),
      TypeOrmModule.forFeature([
        UserRepository,
        ItemRepository,
        FinancialRepository,
        FinancialDetailRepository,
      ]),
      AuthModule,
    ],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();
  itemRepository = moduleFixture.get(ItemRepository);
  userRepository = moduleFixture.get(UserRepository);
});

afterAll(async () => {
  await app.close();
});

afterEach(async () => {
  await itemRepository.clear();
  await userRepository.clear();
});

describe('Items CRUD', () => {
  it('should be able to create an Item', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);

    await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Item 1',
        price: 100,
        is_active: true,
      })
      .expect(HttpStatus.CREATED);
  });

  it('should not be able to create an Item with same name', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);

    const item = await itemRepository.createItem({
      name: 'Item 1',
      price: 100,
      is_active: true,
    });

    await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: item.name,
        price: 200,
        is_active: true,
      })
      .expect(HttpStatus.CONFLICT);
  });

  it('should not be able to create an Item with an authenticated normal user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.USER);

    await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Item 1',
        price: 200,
        is_active: true,
      })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should not be able to create an Item without authentication', async () => {
    await request(app.getHttpServer())
      .post('/items')
      .send({
        name: 'Item 1',
        price: 200,
        is_active: true,
      })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should be able to get an item by uuid', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.USER);
    const item = await itemRepository.createItem({
      name: 'Item 1',
      price: 100,
      is_active: true,
    });
    await itemRepository.createItem({
      name: 'Item 2',
      price: 200,
      is_active: true,
    });

    await request(app.getHttpServer())
      .get(`/items/${item.uuid}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.name).toBe(item.name);
        expect(res.body.price).toBe(item.price);
        expect(res.body.is_active).toBe(item.is_active);
      });
  });

  it('should not be able to get an item by uuid with an invalid uuid', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);

    await request(app.getHttpServer())
      .get(`/items/1234567890`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .expect(HttpStatus.NOT_FOUND);
  });

  it('should be able to find an item by name', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.USER);
    await itemRepository.createItem({
      name: 'Item 1',
      price: 100,
      is_active: true,
    });
    const item2 = await itemRepository.createItem({
      name: 'Item 2',
      price: 200,
      is_active: true,
    });

    await request(app.getHttpServer())
      .get(`/items?name=Item 2`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.items[0].name).toBe(item2.name);
      });
  });

  it('should be able to update an item', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const item = await itemRepository.createItem({
      name: 'Item 1',
      price: 100,
      is_active: true,
    });

    await request(app.getHttpServer())
      .patch(`/items/${item.uuid}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send({ name: 'Item 1 Updated', price: 200 })
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.name).toBe('Item 1 Updated');
        expect(res.body.price).toBe(200);
      });
  });

  it('should not be able to update an item with an authenticated normal user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.USER);
    const item = await itemRepository.createItem({
      name: 'item 1',
      price: 100,
      is_active: true,
    });

    await request(app.getHttpServer())
      .patch(`/items/${item.uuid}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send({ name: 'Item 1 updated' })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should not be able to update an item with an invalid uuid', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);

    await request(app.getHttpServer())
      .patch(`/items/1234567890`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send({ name: 'Item updated' })
      .expect(HttpStatus.NOT_FOUND);
  });

  it('should be able to delete an item with an authenticated admin user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    let item = await itemRepository.createItem({
      name: 'item 1',
      price: 100,
      is_active: true,
    });

    await request(app.getHttpServer())
      .delete(`/items/${item.uuid}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.OK);

    item = await itemRepository.findOne(item.id);
    expect(item).toBeUndefined();
  });

  it('should not be able to delete an item with an invalid uuid', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);

    let item = await itemRepository.createItem({
      name: 'item 1',
      price: 100,
      is_active: true,
    });

    await request(app.getHttpServer())
      .delete(`/items/1234567890`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.NOT_FOUND);

    item = await itemRepository.findOne(item.id);
    expect(item).toBeTruthy();
  });

  it('should not be able to delete an item with an authenticated normal user', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.USER);
    let item = await itemRepository.createItem({
      name: 'item 1',
      price: 100,
      is_active: true,
    });

    await request(app.getHttpServer())
      .delete(`/items/${item.uuid}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .accept('application/json')
      .send()
      .expect(HttpStatus.FORBIDDEN);

    item = await itemRepository.findOne(item.id);
    expect(item).toBeTruthy();
  });
});
