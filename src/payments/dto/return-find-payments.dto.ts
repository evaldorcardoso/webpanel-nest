import { ApiProperty } from '@nestjs/swagger';
import { ReturnPaymentDto } from './return-payment.dto';

export class ReturnFindPaymentsDto {
  @ApiProperty({ type: ReturnPaymentDto, isArray: true })
  payments: ReturnPaymentDto[];

  @ApiProperty({ default: 1 })
  total: number;
}
