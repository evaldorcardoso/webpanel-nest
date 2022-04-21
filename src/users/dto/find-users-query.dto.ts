import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryParametersDto } from 'src/shared/dto/base-query-parameters.dto';

export class FindUsersQueryDto extends BaseQueryParametersDto {
  @ApiProperty({ required: false })
  name: string;

  @ApiProperty({ required: false })
  email: string;

  @ApiProperty({ required: false })
  is_active: boolean;

  @ApiProperty({ required: false })
  role: string;
}
