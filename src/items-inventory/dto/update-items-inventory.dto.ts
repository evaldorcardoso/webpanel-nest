import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateItemsInventoryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  quantity: number;
}
