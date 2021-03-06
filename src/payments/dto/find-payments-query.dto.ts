import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryParametersDto } from '../../shared/dto/base-query-parameters.dto';

export class FindPaymentsQueryDto extends BaseQueryParametersDto {
  @ApiProperty({ required: false })
  name: string;

  @ApiProperty({ required: false })
  type: string;
}
