import { ApiProperty } from '@nestjs/swagger';
import { ReturnItemDto } from './return-item.dto';

export class ReturnFindItemsDto {
  @ApiProperty({ type: ReturnItemDto, isArray: true })
  items: ReturnItemDto[];

  @ApiProperty({ default: 1 })
  total: number;

  constructor({ items, total }: { items: ReturnItemDto[]; total: number }) {
    this.items = items;
    this.total = total;
  }
}
