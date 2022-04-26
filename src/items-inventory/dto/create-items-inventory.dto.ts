import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateItemsInventoryDto {
  @ApiProperty()
  @IsNotEmpty({
    message: 'Informe o item',
  })
  item: string;

  @ApiProperty()
  @IsNotEmpty({
    message: 'Informe a quantidade do item',
  })
  quantity: number;
}
