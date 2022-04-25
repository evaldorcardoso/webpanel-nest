import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty()
  @IsNotEmpty({
    message: 'Informe o nome da forma de pagamento',
  })
  name: string;

  @ApiProperty()
  @IsNotEmpty({
    message: 'Informe o tipo da forma de pagamento',
  })
  type: string;
}
