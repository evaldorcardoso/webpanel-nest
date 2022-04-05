import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty({
    message: 'Informe o nome da empresa',
  })
  @MinLength(3, {
    message: 'O nome da empresa deve ter pelo menos 3 caracteres',
  })
  @MaxLength(100, {
    message: 'O nome da empresa não pode ter mais de 100 caracteres',
  })
  name: string;
}
