import { BaseQueryParametersDto } from 'src/shared/dto/base-query-parameters.dto';

export class FindCompaniesQueryDto extends BaseQueryParametersDto {
  name: string;
}
