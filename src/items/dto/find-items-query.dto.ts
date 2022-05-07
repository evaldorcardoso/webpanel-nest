import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryParametersDto } from '../../shared/dto/base-query-parameters.dto';

export class FindItemsQueryDto extends BaseQueryParametersDto {
  @ApiProperty({ required: false })
  name: string;

  @ApiProperty({ required: false })
  price: number;

  @ApiProperty({ required: false })
  is_active: boolean;
}
