import { ApiProperty } from '@nestjs/swagger';
import { ItemsInventory } from '../entities/items-inventory.entity';
import { ReturnItemInventoryDto } from './return-item-inventory.dto';

export class ReturnItemsInventoryDto {
  @ApiProperty()
  itemsInventory: ReturnItemInventoryDto[];

  @ApiProperty()
  total: number;
}
