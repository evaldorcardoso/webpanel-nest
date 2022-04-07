import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import * as request from 'supertest';

describe('E2E Tests for User Endpoints', () => {
  let app: INestApplication;

  beforeEach(async () => {
    jest.setTimeout(10000);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create an user', () => {
    const user: CreateUserDto = {
      name: 'Test User',
      email: 'email@test.com.br',
      password: '123456',
      passwordConfirmation: '123456',
    };
    return request(app.getHttpServer())
      .post('/users')
      .set('Accept', 'application/json')
      .send(user)
      .expect(201);
  });
});
