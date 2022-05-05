import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../company.entity';

export class ReturnCompanyDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  name: string;

  constructor(company: Company) {
    this.uuid = company.uuid;
    this.name = company.name;
  }
}
