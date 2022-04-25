import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { FinancialDetail } from '../entities/financial-detail.entity';

@EntityRepository(FinancialDetail)
export class FinancialDetailRepository extends Repository<FinancialDetail> {
  async createFinancialDetail(
    financial_id,
    CreateFinancialDetailDto,
  ): Promise<FinancialDetail> {
    const { value } = CreateFinancialDetailDto;

    const financialDetail = this.create();
    financialDetail.value = value;
    financialDetail.financial = financial_id;

    try {
      await financialDetail.save();
      return financialDetail;
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao cadastrar detalhe financeiro',
      );
    }
  }
}
