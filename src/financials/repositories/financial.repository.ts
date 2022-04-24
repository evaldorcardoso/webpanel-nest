import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { CreateFinancialDto } from '../dto/create-financial.dto';
import { FindFinancialsQueryDto } from '../dto/find-financials-query.dto';
import { ReturnFinancialDto } from '../dto/return-financial.dto';
import { ReturnFindFinancialsDto } from '../dto/return-find-financials.dto';
import { Financial } from '../entities/financial.entity';

@EntityRepository(Financial)
export class FinancialRepository extends Repository<Financial> {
  async findFinancials(
    queryDto: FindFinancialsQueryDto,
  ): Promise<ReturnFindFinancialsDto> {
    queryDto.page = queryDto.page === undefined ? 1 : queryDto.page;
    queryDto.limit = queryDto.limit > 100 ? 100 : queryDto.limit;
    queryDto.limit = queryDto.limit === undefined ? 100 : queryDto.limit;

    const { company, created_at } = queryDto;
    const query = this.createQueryBuilder('financial');
    if (company) {
      query.andWhere('financial.company LIKE :company', {
        company: `%${company}%`,
      });
    }

    if (created_at) {
      query.andWhere('financial.created_at LIKE :created_at', {
        created_at: `%${created_at}%`,
      });
    }
    query.skip((queryDto.page - 1) * queryDto.limit);
    query.take(+queryDto.limit);
    query.orderBy(queryDto.sort ? JSON.parse(queryDto.sort) : undefined);
    query.select([
      'financial.uuid',
      'financial.company',
      'financial.created_at',
    ]);

    const [financials, total] = await query.getManyAndCount();

    return { financials, total };
  }

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
      return financial;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException('Caixa já cadastrado');
      } else {
        throw new InternalServerErrorException('Erro ao cadastrar caixa');
      }
    }
  }
}
