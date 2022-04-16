import { Module } from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { FinancialsController } from './financials.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyRepository } from 'src/companies/repositories/companies.repository';
import { FinancialRepository } from './repositories/financial.repository';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyRepository, FinancialRepository]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [FinancialsController],
  providers: [FinancialsService],
})
export class FinancialsModule {}
