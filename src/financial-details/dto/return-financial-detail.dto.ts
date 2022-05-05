import { ApiProperty } from '@nestjs/swagger';
import { FinancialDetail } from '../financial-detail.entity';

export class ReturnFinancialDetailDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  created_at: Date;

  constructor(financialDetail: FinancialDetail) {
    this.uuid = financialDetail.uuid ? financialDetail.uuid : null;
    this.value = financialDetail.value ? financialDetail.value : null;
    this.created_at = financialDetail.created_at
      ? financialDetail.created_at
      : null;
  }
}
