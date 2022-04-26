import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  value?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  is_active?: boolean;
}
