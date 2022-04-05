import { IsNotEmpty } from 'class-validator';

export class CreateFinancialDto {
  @IsNotEmpty({
    message: 'Informe a empresa',
  })
  company: string;
}
