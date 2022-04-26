import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class CreateItemDto {
  @ApiProperty()
  @IsNotEmpty({
    message: 'Informe o nome do item',
  })
  @MinLength(3, {
    message: 'O nome do item deve ter pelo menos 3 caracteres',
  })
  name: string;

  @ApiProperty()
  @IsNotEmpty({
    message: 'Informe o preço do item',
  })
  price: number;

  @ApiProperty()
  is_active: boolean;
}
