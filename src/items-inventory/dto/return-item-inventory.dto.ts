import { ApiProperty } from '@nestjs/swagger';
import { ItemsInventory } from '../items-inventory.entity';

export class ReturnItemInventoryDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  item: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  constructor(itemsInventory: ItemsInventory) {
    this.uuid = itemsInventory.uuid ? itemsInventory.uuid : null;
    this.item = itemsInventory.item ? itemsInventory.item.uuid : null;
    this.quantity = itemsInventory.quantity ? itemsInventory.quantity : null;
    this.created_at = itemsInventory.created_at
      ? itemsInventory.created_at
      : null;
    this.updated_at = itemsInventory.updated_at
      ? itemsInventory.updated_at
      : null;
  }
}
