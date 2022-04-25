import { Module } from '@nestjs/common';
import { FinancialDetailsService } from './financial-details.service';
import { FinancialDetailsController } from './financial-details.controller';
import { FinancialDetailRepository } from './repositories/financial-detail.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialRepository } from 'src/financials/repositories/financial.repository';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialDetailRepository, FinancialRepository]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [FinancialDetailsController],
  providers: [FinancialDetailsService],
})
export class FinancialDetailsModule {}
