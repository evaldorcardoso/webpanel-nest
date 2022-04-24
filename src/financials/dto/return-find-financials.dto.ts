import { ApiProperty } from '@nestjs/swagger';
import { ReturnFinancialDto } from './return-financial.dto';

export class ReturnFindFinancialsDto {
  @ApiProperty({ type: ReturnFinancialDto, isArray: true })
  financials: ReturnFinancialDto[];

  @ApiProperty({ default: 1 })
  total: number;
}
