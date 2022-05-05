import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { CreateFinancialDto } from './dto/create-financial.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from 'src/auth/role.decorator';
import { UserRole } from 'src/users/user-roles.enum';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/users/user.entity';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ReturnFinancialDto } from './dto/return-financial.dto';
import { FindFinancialsQueryDto } from './dto/find-financials-query.dto';
import { ReturnFindFinancialsDto } from './dto/return-find-financials.dto';
import { FinancialDetailsService } from 'src/financial-details/financial-details.service';
import { CreateFinancialDetailDto } from 'src/financial-details/dto/create-financial-detail.dto';
import { ReturnFinancialCompleteDto } from './dto/return-financial-complete.dto';
import { ReturnFinancialDetailDto } from 'src/financial-details/dto/return-financial-detail.dto';

@ApiTags('Financials')
@ApiBearerAuth()
@Controller('financials')
@UseGuards(AuthGuard(), RolesGuard)
export class FinancialsController {
  constructor(
    private readonly financialsService: FinancialsService,
    private readonly financialDetailsService: FinancialDetailsService,
  ) {}

  @Post('/:financial/details')
  @ApiTags('Financial details')
  @ApiOperation({ summary: 'Add a financial detail' })
  @ApiCreatedResponse()
  async createFinancialDetails(
    @Param('financial') financial_uuid: string,
    @Body() createFinancialDetailDto: CreateFinancialDetailDto,
  ): Promise<ReturnFinancialDetailDto> {
    return new ReturnFinancialDetailDto(
      await this.financialDetailsService.create(
        financial_uuid,
        createFinancialDetailDto,
      ),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Register a new financial' })
  @ApiCreatedResponse({ type: ReturnFinancialDto })
  @UseGuards(AuthGuard())
  async create(
    @Body() createFinancialDto: CreateFinancialDto,
    @GetUser() user: User,
  ): Promise<ReturnFinancialDto> {
    return new ReturnFinancialDto(
      await this.financialsService.create(user, createFinancialDto),
    );
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get a financial and its details by uuid' })
  @ApiOkResponse({ type: ReturnFinancialCompleteDto })
  @Role(UserRole.ADMIN)
  async findOne(
    @Param('uuid') uuid: string,
  ): Promise<ReturnFinancialCompleteDto> {
    return new ReturnFinancialCompleteDto(
      await this.financialsService.findOne(uuid),
    );
  }

  @Get()
  @ApiOperation({ summary: 'find financials by filter query' })
  @ApiOkResponse({ type: ReturnFindFinancialsDto })
  @Role(UserRole.ADMIN)
  async findAll(
    @Query() query: FindFinancialsQueryDto,
  ): Promise<ReturnFindFinancialsDto> {
    const found = await this.financialsService.findAll(query);
    return {
      financials: found.financials,
      total: found.total,
    };
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Delete a financial' })
  @ApiOkResponse()
  @Role(UserRole.ADMIN)
  async remove(@Param('uuid') uuid: string) {
    return await this.financialsService.remove(uuid);
  }

  @Delete(':financial/details/:uuid')
  @ApiTags('Financial details')
  @ApiOperation({ summary: 'Delete a financial detail' })
  @ApiOkResponse()
  async deleteFinancialDetails(
    @Param('financial') financial_uuid: string,
    @Param('uuid') uuid: string,
  ) {
    await this.financialDetailsService.remove(financial_uuid, uuid);
  }
}
