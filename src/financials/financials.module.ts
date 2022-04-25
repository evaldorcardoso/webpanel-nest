import { Module } from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { FinancialsController } from './financials.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyRepository } from 'src/companies/repositories/companies.repository';
import { FinancialRepository } from './repositories/financial.repository';
import { PassportModule } from '@nestjs/passport';
import { FinancialDetailsService } from 'src/financial-details/financial-details.service';
import { FinancialDetailRepository } from 'src/financial-details/repositories/financial-detail.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyRepository,
      FinancialRepository,
      FinancialDetailRepository,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [FinancialsController],
  providers: [FinancialsService, FinancialDetailsService],
})
export class FinancialsModule {}
