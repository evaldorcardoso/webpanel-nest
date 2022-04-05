import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { FindCompaniesQueryDto } from '../dto/find-companies-query.dto';
import { Company } from '../entities/company.entity';

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
    console.log(queryDto.limit);
    query.skip((queryDto.page - 1) * queryDto.limit);
    query.take(+queryDto.limit);
    query.orderBy(queryDto.sort ? JSON.parse(queryDto.sort) : undefined);
    query.select(['company.name']);

    const [companies, total] = await query.getManyAndCount();

    return { companies, total };
  }

  async createCompany(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const { name } = createCompanyDto;

    const company = this.create();
    company.name = name;

    try {
      await company.save();
    } catch (error) {
      if (error.code === 'ERR_DUP_ENTRY') {
        throw new ConflictException('Empresa já cadastrada');
      } else {
        throw new InternalServerErrorException(
          'Erro ao cadastrar empresa no banco de dados',
        );
      }
    }

    return company;
  }
}
