import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryParametersDto } from 'src/shared/dto/base-query-parameters.dto';
import { UserRole } from '../user-roles.enum';

export class FindUsersQueryDto extends BaseQueryParametersDto {
  @ApiProperty({ required: false })
  name: string;

  @ApiProperty({ required: false })
  email: string;

  @ApiProperty({ required: false })
  is_active: boolean;

  @ApiProperty({ enum: UserRole, required: false })
  role: UserRole;
}
