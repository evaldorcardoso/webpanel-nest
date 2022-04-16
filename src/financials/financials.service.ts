import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyRepository } from 'src/companies/repositories/companies.repository';
import { UserRole } from 'src/users/user-roles.enum';
import { CreateFinancialDto } from './dto/create-financial.dto';
import { UpdateFinancialDto } from './dto/update-financial.dto';
import { FinancialRepository } from './repositories/financial.repository';

@Injectable()
export class FinancialsService {
  constructor(
    @InjectRepository(FinancialRepository)
    @InjectRepository(CompanyRepository)
    private readonly financialRepository: FinancialRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async create(user, createFinancialDto: CreateFinancialDto) {
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

  findAll() {
    return `This action returns all financials`;
  }

  findOne(id: number) {
    return `This action returns a #${id} financial`;
  }

  async remove(uuid: string) {
    const result = await this.financialRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException('Caixa não encontrado');
    }
  }
}
