import { ApiProperty } from '@nestjs/swagger';
import { ReturnFinancialDetailDto } from '../../financial-details/dto/return-financial-detail.dto';
import { Financial } from '../financial.entity';

export class ReturnFinancialCompleteDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  company: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({ type: ReturnFinancialDetailDto, isArray: true })
  financialDetails: ReturnFinancialDetailDto[] = [];

  constructor(financial: Financial) {
    this.uuid = financial.uuid ? financial.uuid : null;
    this.company = financial.company ? financial.company : null;
    this.created_at = financial.created_at ? financial.created_at : null;
    this.financialDetails = financial.financialDetails
      ? financial.financialDetails
      : null;
  }
}
