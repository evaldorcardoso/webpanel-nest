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
import { User } from 'src/users/entities/user.entity';
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

@ApiTags('Financials')
@ApiBearerAuth()
@Controller('financials')
@UseGuards(AuthGuard(), RolesGuard)
export class FinancialsController {
  constructor(
    private readonly financialsService: FinancialsService,
    private readonly financialDetailsService: FinancialDetailsService,
  ) {}

  @Post('/:uuid/details')
  @ApiOperation({ summary: 'Add financial details' })
  @ApiCreatedResponse()
  async createFinancialDetails(
    @Param('uuid') financial_uuid: string,
    @Body() createFinancialDto: CreateFinancialDto,
  ) {
    return await this.financialDetailsService.create(
      financial_uuid,
      createFinancialDto,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Register a new financial' })
  @ApiCreatedResponse({ type: ReturnFinancialDto })
  @UseGuards(AuthGuard())
  async create(
    @Body() createFinancialDto: CreateFinancialDto,
    @GetUser() user: User,
  ) {
    return await this.financialsService.create(user, createFinancialDto);
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
}
