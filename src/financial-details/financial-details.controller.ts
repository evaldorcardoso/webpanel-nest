import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FinancialDetailsService } from './financial-details.service';
import { CreateFinancialDetailDto } from './dto/create-financial-detail.dto';
import { UpdateFinancialDetailDto } from './dto/update-financial-detail.dto';

@Controller('financial-details')
export class FinancialDetailsController {
  constructor(
    private readonly financialDetailsService: FinancialDetailsService,
  ) {}

  @Post(':uuid/financial/add')
  create(@Body() createFinancialDetailDto: CreateFinancialDetailDto) {
    // return this.financialDetailsService.create(createFinancialDetailDto);
  }

  @Get()
  findAll() {
    return this.financialDetailsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.financialDetailsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFinancialDetailDto: UpdateFinancialDetailDto,
  ) {
    return this.financialDetailsService.update(+id, updateFinancialDetailDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.financialDetailsService.remove(+id);
  }
}
