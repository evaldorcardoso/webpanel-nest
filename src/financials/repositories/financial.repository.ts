import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { CreateFinancialDto } from '../dto/create-financial.dto';
import { ReturnFinancialDto } from '../dto/return-financial.dto';
import { Financial } from '../entities/financial.entity';

@EntityRepository(Financial)
export class FinancialRepository extends Repository<Financial> {
  async createFinancial(
    user_id,
    CreateFinancialDto: CreateFinancialDto,
  ): Promise<ReturnFinancialDto> {
    const { company } = CreateFinancialDto;

    const financial = this.create();
    financial.company = company;
    financial.user = user_id;

    try {
      await financial.save();
      return { financial, message: 'Caixa criado com sucesso' };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException('Caixa já cadastrado');
      } else {
        throw new InternalServerErrorException('Erro ao cadastrar caixa');
      }
    }
  }
}
