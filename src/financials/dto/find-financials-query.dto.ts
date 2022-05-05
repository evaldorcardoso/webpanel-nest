import { BaseQueryParametersDto } from '../../shared/dto/base-query-parameters.dto';

export class FindFinancialsQueryDto extends BaseQueryParametersDto {
  company: string;
  created_at: Date;
}
