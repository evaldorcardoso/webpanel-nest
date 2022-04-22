import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCompanyDto {
  @ApiProperty()
  @IsOptional()
  @IsString({
    message: 'Informe o nome da empresa',
  })
  name: string;
}
