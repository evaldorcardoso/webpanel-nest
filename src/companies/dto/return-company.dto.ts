import { Company } from '../entities/company.entity';

export class ReturnCompanyDto {
  company: Company;
  message: string;
}
