import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateFinancialDto {
  @ApiProperty()
  @IsNotEmpty({
    message: 'Informe a empresa',
  })
  company: string;
}
