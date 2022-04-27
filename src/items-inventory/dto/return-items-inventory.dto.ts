import { ApiProperty } from '@nestjs/swagger';
import { ReturnItemInventoryDto } from './return-item-inventory.dto';

export class ReturnItemsInventoryDto {
  @ApiProperty({ type: ReturnItemInventoryDto, isArray: true })
  itemsInventory: ReturnItemInventoryDto[];

  @ApiProperty()
  total: number;
}
