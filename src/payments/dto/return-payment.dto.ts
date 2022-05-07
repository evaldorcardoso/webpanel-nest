import { ApiProperty } from '@nestjs/swagger';
import { Payment } from '../payment.entity';

export class ReturnPaymentDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  constructor(payment: Payment) {
    this.uuid = payment.uuid ? payment.uuid : null;
    this.name = payment.name ? payment.name : null;
    this.type = payment.type ? payment.type : null;
  }
}
