import { ApiProperty } from '@nestjs/swagger';
import { Financial } from '../entities/financial.entity';

export class ReturnFinancialDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  company: string;

  @ApiProperty()
  created_at: Date;

  constructor(financial: Financial) {
    this.uuid = financial.uuid ? financial.uuid : null;
    this.company = financial.company ? financial.company : null;
    this.created_at = financial.created_at ? financial.created_at : null;
  }
}
