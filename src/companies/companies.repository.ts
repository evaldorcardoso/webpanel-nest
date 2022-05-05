import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '../users/user.entity';
import { EntityRepository, Repository } from 'typeorm';
import { CreateCompanyDto } from './dto/create-company.dto';
import { FindCompaniesQueryDto } from './dto/find-companies-query.dto';
import { Company } from './company.entity';

@EntityRepository(Company)
export class CompanyRepository extends Repository<Company> {
  async findCompanies(
    queryDto: FindCompaniesQueryDto,
  ): Promise<{ companies: Company[]; total: number }> {
    queryDto.page = queryDto.page === undefined ? 1 : queryDto.page;
    queryDto.limit = queryDto.limit > 100 ? 100 : queryDto.limit;
    queryDto.limit = queryDto.limit === undefined ? 100 : queryDto.limit;

    const { name } = queryDto;
    const query = this.createQueryBuilder('company');
    if (name) {
      query.andWhere('company.name LIKE :name', { name: `%${name}%` });
    }
    query.skip((queryDto.page - 1) * queryDto.limit);
    query.take(+queryDto.limit);
    query.orderBy(queryDto.sort ? JSON.parse(queryDto.sort) : undefined);
    query.select(['company.uuid', 'company.name']);

    const [companies, total] = await query.getManyAndCount();

    return { companies, total };
  }

  async myCompanies(
    user_id: number,
    queryDto: FindCompaniesQueryDto,
  ): Promise<{ companies: Company[]; total: number }> {
    queryDto.page = queryDto.page === undefined ? 1 : queryDto.page;
    queryDto.limit = queryDto.limit > 100 ? 100 : queryDto.limit;
    queryDto.limit = queryDto.limit === undefined ? 100 : queryDto.limit;

    const { name } = queryDto;
    const query = this.createQueryBuilder('company');
    if (name) {
      query.andWhere('company.name LIKE :name', { name: `%${name}%` });
    }
    query.skip((queryDto.page - 1) * queryDto.limit);
    query.take(+queryDto.limit);
    query.orderBy(queryDto.sort ? JSON.parse(queryDto.sort) : undefined);
    query.select();
    query
      .innerJoin('company_has_user', 'chu', 'chu.companyId = company.id')
      .andWhere('chu.userId = :user_id', { user_id });

    const [companies, total] = await query.getManyAndCount();

    return { companies, total };
  }

  async createCompany(
    user_id,
    createCompanyDto: CreateCompanyDto,
  ): Promise<Company> {
    const { name } = createCompanyDto;

    const user = await User.findOne({ where: { id: user_id } });
    const company = this.create();
    company.name = name;
    company.has = [user];

    try {
      await company.save();
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException('Empresa já cadastrada');
      } else {
        throw new InternalServerErrorException(
          'Erro ao cadastrar empresa no banco de dados',
        );
      }
    }

    return company;
  }

  async linkUser(company_uuid, user_uuid) {
    const company = await this.findOne(
      { uuid: company_uuid },
      { relations: ['has'] },
    );
    const user = await User.findOne({ where: { uuid: user_uuid } });

    company.has.push(user);

    try {
      await company.save();
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException('Usuário já vinculado a empresa');
      } else {
        throw new InternalServerErrorException(
          'Erro ao vincular usuário no banco de dados',
        );
      }
    }

    return company;
  }

  async isOwnedByUser(user_id, company_uuid): Promise<boolean> {
    const result = await this.findOne({
      relations: ['has'],
      where: {
        uuid: company_uuid,
      },
    });

    return result.has.some((user) => user.id === user_id);
  }
}
