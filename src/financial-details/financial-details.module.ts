import { Module } from '@nestjs/common';
import { FinancialDetailsService } from './financial-details.service';
import { FinancialDetailRepository } from './financial-detail.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialRepository } from '../financials/financial.repository';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialDetailRepository, FinancialRepository]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [FinancialDetailsService],
})
export class FinancialDetailsModule {}
