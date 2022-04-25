import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateFinancialDetailDto {
  @ApiProperty()
  @IsNotEmpty({
    message: 'Informe o valor do lançamento',
  })
  value: number;
}
