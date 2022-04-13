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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/user-roles.enum';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { FindCompaniesQueryDto } from './dto/find-companies-query.dto';
import { ReturnCompanyDto } from './dto/return-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
@UseGuards(AuthGuard(), RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Role(UserRole.ADMIN)
  async create(
    @Body(ValidationPipe) createCompanyDto: CreateCompanyDto,
    @GetUser() user: User,
  ): Promise<ReturnCompanyDto> {
    const company = await this.companiesService.create(
      user.id,
      createCompanyDto,
    );
    return {
      company,
      message: 'Empresa criada com sucesso',
    };
  }

  @Get(':uuid')
  async findCompanyByUuid(@Param('uuid') uuid: string) {
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
