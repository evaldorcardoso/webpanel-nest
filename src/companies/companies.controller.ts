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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/user-roles.enum';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { FindCompaniesQueryDto } from './dto/find-companies-query.dto';
import { ReturnCompanyDto } from './dto/return-company.dto';
import { ReturnFindCompaniesDto } from './dto/return-find-companies.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiBearerAuth()
@ApiTags('Companies')
@Controller('companies')
@UseGuards(AuthGuard(), RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Company' })
  @ApiCreatedResponse({ type: ReturnCompanyDto })
  @Role(UserRole.ADMIN)
  async create(
    @Body(ValidationPipe) createCompanyDto: CreateCompanyDto,
    @GetUser() user: User,
  ): Promise<ReturnCompanyDto> {
    const company = await this.companiesService.create(
      user.id,
      createCompanyDto,
    );

    return new ReturnCompanyDto(company);
  }

  @Get('/me')
  @ApiOperation({ summary: 'Get the Company(es) linked to the logged user' })
  @ApiOkResponse({ type: ReturnFindCompaniesDto })
  async findMyCompanies(
    @Query() query: FindCompaniesQueryDto,
    @GetUser() user: User,
  ): Promise<ReturnFindCompaniesDto> {
    const found = await this.companiesService.findMyCompanies(user.id, query);

    return {
      companies: found.companies,
      total: found.total,
    };
  }

  @Get(':uuid/users/:userUuid')
  @ApiOperation({ summary: 'Link an user to a company' })
  @ApiOkResponse({ type: ReturnCompanyDto })
  @Role(UserRole.ADMIN)
  async linkUserToCompany(
    @Param('uuid') companyUuid: string,
    @Param('userUuid') userUuid: string,
  ): Promise<ReturnCompanyDto> {
    const company = await this.companiesService.linkUser(companyUuid, userUuid);
    return new ReturnCompanyDto(company);
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get a Company by UUID' })
  @ApiOkResponse({ type: ReturnCompanyDto })
  async findCompanyByUuid(
    @Param('uuid') uuid: string,
  ): Promise<ReturnCompanyDto> {
    return await this.companiesService.findByUuid(uuid);
  }

  @Get()
  @ApiOperation({ summary: 'Find companies by filter query' })
  @ApiOkResponse({ type: ReturnFindCompaniesDto })
  @Role(UserRole.ADMIN)
  async findCompanies(
    @Query() query: FindCompaniesQueryDto,
  ): Promise<ReturnFindCompaniesDto> {
    const found = await this.companiesService.findCompanies(query);
    return {
      companies: found.companies,
      total: found.total,
    };
  }

  @Patch(':uuid')
  @ApiOperation({ summary: 'Update the company data' })
  @ApiOkResponse({ type: ReturnCompanyDto })
  @Role(UserRole.ADMIN)
  async update(
    @Param('uuid') uuid: string,
    @Body(ValidationPipe) updateCompanyDto: UpdateCompanyDto,
  ): Promise<ReturnCompanyDto> {
    const company = await this.companiesService.update(updateCompanyDto, uuid);

    return new ReturnCompanyDto(company);
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Delete a Company' })
  @ApiOkResponse({ description: 'Empresa deletada com sucesso' })
  @Role(UserRole.ADMIN)
  async delete(@Param('uuid') uuid: string) {
    await this.companiesService.delete(uuid);
    return {
      message: 'Empresa deletada com sucesso',
    };
  }
}
