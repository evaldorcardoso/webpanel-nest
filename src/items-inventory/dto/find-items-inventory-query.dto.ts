import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { BaseQueryParametersDto } from 'src/shared/dto/base-query-parameters.dto';

export class FindItemsInventoryQueryDto extends BaseQueryParametersDto {
  @ApiProperty({ required: false })
  @IsOptional()
  item: string;

  @ApiProperty({ required: false })
  @IsOptional()
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  created_at: Date;
}
