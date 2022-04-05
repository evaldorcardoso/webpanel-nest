import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { CreateFinancialDto } from '../dto/create-financial.dto';
import { Financial } from '../entities/financial.entity';

@EntityRepository(Financial)
export class FinancialRepository extends Repository<Financial> {
  async createFinancial(
    CreateFinancialDto: CreateFinancialDto,
  ): Promise<Financial> {
    const { company } = CreateFinancialDto;

    const financial = this.create();
    financial.company = company;

    try {
      await financial.save();
      return financial;
    } catch (error) {
      if (error.code === 'ERR_DUP_ENTRY') {
        throw new ConflictException('Caixa já cadastrado');
      } else {
        throw new InternalServerErrorException('Erro ao cadastrar caixa');
      }
    }
  }
}
