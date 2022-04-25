import { PartialType } from '@nestjs/swagger';
import { CreateFinancialDetailDto } from './create-financial-detail.dto';

export class UpdateFinancialDetailDto extends PartialType(CreateFinancialDetailDto) {}
