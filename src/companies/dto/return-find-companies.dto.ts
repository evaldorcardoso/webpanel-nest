import { ApiProperty } from '@nestjs/swagger';
import { ReturnCompanyDto } from './return-company.dto';

export class ReturnFindCompaniesDto {
  @ApiProperty({ type: ReturnCompanyDto, isArray: true })
  companies: ReturnCompanyDto[];

  @ApiProperty({ default: 1 })
  total: number;
}
