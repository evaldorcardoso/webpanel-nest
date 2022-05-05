import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyRepository } from '../companies/companies.repository';
import { UserRole } from '../users/user-roles.enum';
import { CreateFinancialDto } from './dto/create-financial.dto';
import { FindFinancialsQueryDto } from './dto/find-financials-query.dto';
import { ReturnFindFinancialsDto } from './dto/return-find-financials.dto';
import { Financial } from './entities/financial.entity';
import { FinancialRepository } from './repositories/financial.repository';

@Injectable()
export class FinancialsService {
  constructor(
    @InjectRepository(FinancialRepository)
    @InjectRepository(CompanyRepository)
    private readonly financialRepository: FinancialRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async create(
    user,
    createFinancialDto: CreateFinancialDto,
  ): Promise<Financial> {
    if (
      user.role !== UserRole.ADMIN &&
      !(await this.companyRepository.isOwnedByUser(
        user.id,
        createFinancialDto.company,
      ))
    ) {
      throw new ForbiddenException();
    }

    return await this.financialRepository.createFinancial(
      user.id,
      createFinancialDto,
    );
  }

  async findAll(
    queryDto: FindFinancialsQueryDto,
  ): Promise<ReturnFindFinancialsDto> {
    return await this.financialRepository.findFinancials(queryDto);
  }

  async findOne(uuid: string) {
    return await this.financialRepository.findOne(
      { uuid },
      { relations: ['financialDetails'] },
    );
  }

  async remove(uuid: string) {
    const result = await this.financialRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException('Caixa não encontrado');
    }
  }
}
