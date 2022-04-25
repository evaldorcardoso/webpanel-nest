import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FinancialRepository } from 'src/financials/repositories/financial.repository';
import { CreateFinancialDetailDto } from './dto/create-financial-detail.dto';
import { UpdateFinancialDetailDto } from './dto/update-financial-detail.dto';
import { FinancialDetailRepository } from './repositories/financial-detail.repository';

@Injectable()
export class FinancialDetailsService {
  constructor(
    @InjectRepository(FinancialDetailRepository)
    @InjectRepository(FinancialRepository)
    private readonly financialDetailRepository: FinancialDetailRepository,
    private readonly financialRepository: FinancialRepository,
  ) {}

  async create(
    financial_uuid,
    createFinancialDetailDto: CreateFinancialDetailDto,
  ) {
    const financial = await this.financialRepository.findOne(
      {
        uuid: financial_uuid,
      },
      { select: ['id'] },
    );
    return await this.financialDetailRepository.createFinancialDetail(
      financial.id,
      createFinancialDetailDto,
    );
  }

  findAll() {
    return `This action returns all financialDetails`;
  }

  findOne(id: number) {
    return `This action returns a #${id} financialDetail`;
  }

  update(id: number, updateFinancialDetailDto: UpdateFinancialDetailDto) {
    return `This action updates a #${id} financialDetail`;
  }

  remove(id: number) {
    return `This action removes a #${id} financialDetail`;
  }
}
