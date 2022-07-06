import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getConnectionOptions } from 'typeorm';
import { Connection } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './configs/winston.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerInterceptor } from './interceptors/logger.interceptor';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from './configs/mailer.config';
import { CompaniesModule } from './companies/companies.module';
import { FinancialsModule } from './financials/financials.module';
import { ConfigModule } from '@nestjs/config';
import { FinancialDetailsModule } from './financial-details/financial-details.module';
import { PaymentsModule } from './payments/payments.module';
import { ItemsModule } from './items/items.module';
import { ItemsInventoryModule } from './items-inventory/items-inventory.module';
import { PreauthMiddleware } from './auth/preauth.middleware';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        Object.assign(await getConnectionOptions(), {
          autoLoadEntities: true,
        }),
    }),
    WinstonModule.forRoot(winstonConfig),
    MailerModule.forRoot(mailerConfig),
    CompaniesModule,
    UsersModule,
    AuthModule,
    FinancialsModule,
    FinancialDetailsModule,
    PaymentsModule,
    ItemsModule,
    ItemsInventoryModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PreauthMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
  constructor(private connection: Connection) {}
}
