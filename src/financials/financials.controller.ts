import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { CreateFinancialDto } from './dto/create-financial.dto';
import { UpdateFinancialDto } from './dto/update-financial.dto';

@Controller('financials')
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  @Post()
  create(@Body() createFinancialDto: CreateFinancialDto) {
    return this.financialsService.create(createFinancialDto);
  }

  @Get()
  findAll() {
    return this.financialsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.financialsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFinancialDto: UpdateFinancialDto) {
    return this.financialsService.update(+id, updateFinancialDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.financialsService.remove(+id);
  }
}
