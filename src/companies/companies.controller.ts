import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { FindCompaniesQueryDto } from './dto/find-companies-query.dto';
import { ReturnCompanyDto } from './dto/return-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  async create(
    @Body(ValidationPipe) createCompanyDto: CreateCompanyDto,
  ): Promise<ReturnCompanyDto> {
    const company = await this.companiesService.create(createCompanyDto);
    return {
      company,
      message: 'Empresa criada com sucesso',
    };
  }

  @Get(':uuid')
  async findUserByUuid(@Param('uuid') uuid: string) {
    return this.companiesService.findByUuid(uuid);
  }

  @Get()
  async findCompanies(@Query() query: FindCompaniesQueryDto) {
    const found = await this.companiesService.findCompanies(query);
    const message =
      found.total === 0
        ? 'Nenhuma empresa encontrada'
        : `${found.total} empresas encontradas`;
    return {
      found,
      message,
    };
  }

  @Patch(':uuid')
  update(
    @Param('uuid') uuid: string,
    @Body(ValidationPipe) updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(updateCompanyDto, uuid);
  }

  @Delete(':uuid')
  async delete(@Param('uuid') uuid: string) {
    await this.companiesService.delete(uuid);
    return {
      message: 'Empresa deletada com sucesso',
    };
  }
}
