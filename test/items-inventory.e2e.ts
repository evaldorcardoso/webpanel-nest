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
import { Financial } from '../src/financials/financial.entity';
import { FinancialRepository } from '../src/financials/financial.repository';
import { ItemsInventory } from '../src/items-inventory/items-inventory.entity';
import { ItemsInventoryModule } from '../src/items-inventory/items-inventory.module';
import { ItemsInventoryRepository } from '../src/items-inventory/items-inventory.repository';
import { Item } from '../src/items/item.entity';
import { ItemRepository } from '../src/items/items.repository';
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

let itemRepository: ItemRepository;
let itemsInventoryRepository: ItemsInventoryRepository;
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
        entities: [
          User,
          Company,
          Financial,
          FinancialDetail,
          Item,
          ItemsInventory,
        ],
        synchronize: true,
        logging: false,
      }),
      TypeOrmModule.forFeature([
        UserRepository,
        CompanyRepository,
        FinancialRepository,
        FinancialDetailRepository,
        ItemRepository,
        ItemsInventoryRepository,
      ]),
      AuthModule,
      CompaniesModule,
      ItemsInventoryModule,
    ],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();
  companyRepository = moduleFixture.get(CompanyRepository);
  itemRepository = moduleFixture.get(ItemRepository);
  itemsInventoryRepository = moduleFixture.get(ItemsInventoryRepository);
  userRepository = moduleFixture.get(UserRepository);
});

afterAll(async () => {
  await app.close();
});

afterEach(async () => {
  await itemsInventoryRepository.clear();
  await itemRepository.clear();
  await companyRepository.clear();
  await userRepository.clear();
});

describe('Items Inventory CRUD', () => {
  it('should be able to register an Item Inventory to a company with an authenticated admin User', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      email: 'admin@email.com',
    });

    const company = await companyRepository.createCompany(user.id, {
      name: 'Company',
    });

    const item = await itemRepository.createItem({
      name: 'Item',
      price: 100,
      is_active: true,
    });

    const item2 = await itemRepository.createItem({
      name: 'Item 2',
      price: 200,
      is_active: true,
    });

    await request(app.getHttpServer())
      .post('/items-inventory/company/' + company.uuid)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send([
        {
          item: item.uuid,
          quantity: 10,
        },
        {
          item: item2.uuid,
          quantity: 20,
        },
      ])
      .expect(HttpStatus.CREATED);
  });

  it('should be able to find an Item Inventory of a company by uuid with an authenticated admin User', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      email: 'admin@email.com',
    });

    const company = await companyRepository.createCompany(user.id, {
      name: 'Company',
    });

    const item = await itemRepository.createItem({
      name: 'Item',
      price: 100,
      is_active: true,
    });

    const itemsInventory = await itemsInventoryRepository.createItemInventory(
      company.uuid,
      [
        {
          item: item.uuid,
          quantity: 10,
        },
      ],
    );

    await request(app.getHttpServer())
      .get(
        '/items-inventory/' +
          itemsInventory[0].uuid +
          '/company/' +
          company.uuid,
      )
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.quantity).toBe(itemsInventory[0].quantity);
        expect(response.body.item).toBe(item.uuid);
        expect(response.body.uuid).toBe(itemsInventory[0].uuid);
      });
  });

  it('should be able to search Items Inventory of a company by quantity with an authenticated admin User', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      email: 'admin@email.com',
    });

    const company = await companyRepository.createCompany(user.id, {
      name: 'Company',
    });

    const item = await itemRepository.createItem({
      name: 'Item',
      price: 100,
      is_active: true,
    });

    const itemsInventory = await itemsInventoryRepository.createItemInventory(
      company.uuid,
      [
        {
          item: item.uuid,
          quantity: 10,
        },
        {
          item: item.uuid,
          quantity: 20,
        },
        {
          item: item.uuid,
          quantity: 10,
        },
      ],
    );

    await request(app.getHttpServer())
      .get('/items-inventory/company/' + company.uuid + '?quantity=10')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.total).toBe(2);
        expect(response.body.itemsInventory.length).toBe(2);
        expect(response.body.itemsInventory[0].uuid).toBe(
          itemsInventory[0].uuid,
        );
        expect(response.body.itemsInventory[1].uuid).toBe(
          itemsInventory[2].uuid,
        );
      });
  });

  it('should be able to update an Item Inventory of a company with an authenticated admin User', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      email: 'admin@email.com',
    });

    const company = await companyRepository.createCompany(user.id, {
      name: 'Company',
    });

    const item = await itemRepository.createItem({
      name: 'Item',
      price: 100,
      is_active: true,
    });

    const itemsInventory = await itemsInventoryRepository.createItemInventory(
      company.uuid,
      [
        {
          item: item.uuid,
          quantity: 10,
        },
      ],
    );

    await request(app.getHttpServer())
      .patch(
        '/items-inventory/' +
          itemsInventory[0].uuid +
          '/company/' +
          company.uuid,
      )
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        item: item.uuid,
        quantity: 20,
      })
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.quantity).toBe(20);
        expect(response.body.item).toBe(item.uuid);
        expect(response.body.uuid).toBe(itemsInventory[0].uuid);
      });
  });

  it('should be able to delete an Item Inventory of a company with an authenticated admin User', async () => {
    jwtToken = await createAndAuthenticateUser(UserRole.ADMIN);
    const user = await userRepository.findOne({
      email: 'admin@email.com',
    });

    const company = await companyRepository.createCompany(user.id, {
      name: 'Company',
    });

    const item = await itemRepository.createItem({
      name: 'Item',
      price: 100,
      is_active: true,
    });

    const itemsInventory = await itemsInventoryRepository.createItemInventory(
      company.uuid,
      [
        {
          item: item.uuid,
          quantity: 10,
        },
      ],
    );

    await request(app.getHttpServer())
      .delete(
        '/items-inventory/' +
          itemsInventory[0].uuid +
          '/company/' +
          company.uuid,
      )
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(HttpStatus.OK);
  });
});
