import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCompanyDto } from './dto/create-company.dto';
import { FindCompaniesQueryDto } from './dto/find-companies-query.dto';
import { ReturnCompanyDto } from './dto/return-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { CompanyRepository } from './repositories/companies.repository';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyRepository)
    private companyRepository: CompanyRepository,
  ) {}

  async create(user_id, createCompanyDto: CreateCompanyDto): Promise<Company> {
    return await this.companyRepository.createCompany(
      user_id,
      createCompanyDto,
    );
  }

  async findCompanies(
    queryDto: FindCompaniesQueryDto,
  ): Promise<{ companies: Company[]; total: number }> {
    const companies = await this.companyRepository.findCompanies(queryDto);
    return companies;
  }

  async findMyCompanies(
    user_id,
    queryDto: FindCompaniesQueryDto,
  ): Promise<{ companies: Company[]; total: number }> {
    const companies = await this.companyRepository.myCompanies(
      user_id,
      queryDto,
    );
    return companies;
  }

  async findByUuid(uuid: string): Promise<Company> {
    const company = await this.companyRepository.findOne({ uuid });
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }
    return company;
  }

  async update(
    updateCompanyDto: UpdateCompanyDto,
    uuid: string,
  ): Promise<Company> {
    const result = await this.companyRepository.update(
      { uuid },
      updateCompanyDto,
    );
    if (result.affected === 0) {
      throw new NotFoundException('Empresa não encontrada');
    }
    const company = await this.companyRepository.findOne({ uuid });
    return company;
  }

  async linkUser(company_uuid, user_uuid) {
    return await this.companyRepository.linkUser(company_uuid, user_uuid);
  }

  async delete(uuid: string) {
    const result = await this.companyRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException('Empresa não encontrada');
    }
  }
}
