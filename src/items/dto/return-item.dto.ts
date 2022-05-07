import { ApiProperty } from '@nestjs/swagger';
import { Item } from '../item.entity';

export class ReturnItemDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  constructor(item: Item) {
    this.uuid = item.uuid ? item.uuid : null;
    this.name = item.name ? item.name : null;
    this.price = item.price ? item.price : null;
    this.is_active = item.is_active ? item.is_active : null;
    this.created_at = item.created_at ? item.created_at : null;
  }
}
