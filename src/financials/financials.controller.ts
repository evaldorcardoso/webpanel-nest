import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { CreateFinancialDto } from './dto/create-financial.dto';
import { UpdateFinancialDto } from './dto/update-financial.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from 'src/auth/role.decorator';
import { UserRole } from 'src/users/user-roles.enum';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('financials')
@UseGuards(AuthGuard(), RolesGuard)
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  @Post()
  @UseGuards(AuthGuard())
  async create(
    @Body() createFinancialDto: CreateFinancialDto,
    @GetUser() user: User,
  ) {
    return await this.financialsService.create(user, createFinancialDto);
  }

  @Get()
  @Role(UserRole.ADMIN)
  findAll() {
    return this.financialsService.findAll();
  }

  @Get(':id')
  @Role(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.financialsService.findOne(+id);
  }

  @Delete(':uuid')
  @Role(UserRole.ADMIN)
  async remove(@Param('uuid') uuid: string) {
    return await this.financialsService.remove(uuid);
  }
}
