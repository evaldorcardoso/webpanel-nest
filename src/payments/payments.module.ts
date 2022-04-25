import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRepository } from './repositories/payment.repository';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentRepository]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
