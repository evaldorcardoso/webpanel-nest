import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FinancialRepository } from '../financials/financial.repository';
import { CreateFinancialDetailDto } from './dto/create-financial-detail.dto';
import { FinancialDetailRepository } from './financial-detail.repository';

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

  async remove(financial_uuid, uuid: string) {
    const financial = await this.financialRepository.findOne({
      select: ['id'],
      where: {
        uuid: financial_uuid,
      },
    });
    const financialDetail = await this.financialDetailRepository.findOne({
      select: ['id'],
      where: {
        uuid,
        financial: financial.id,
      },
    });
    const result = await this.financialDetailRepository.delete(
      financialDetail.id,
    );

    if (result.affected === 0) {
      throw new NotFoundException('Lançamento não encontrado');
    }
  }
}
