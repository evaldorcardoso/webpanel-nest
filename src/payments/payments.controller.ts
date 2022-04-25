import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { ReturnPaymentDto } from './dto/return-payment.dto';

@ApiTags('Payment Methods')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(AuthGuard(), RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Payment Method' })
  @ApiCreatedResponse({ type: () => ReturnPaymentDto })
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<ReturnPaymentDto> {
    return await this.paymentsService.create(createPaymentDto);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get a Payment Method by UUID' })
  @ApiOkResponse({ type: () => ReturnPaymentDto })
  async findOne(@Param('uuid') uuid: string) {
    return await this.paymentsService.findOne(uuid);
  }

  @Patch(':uuid')
  @ApiOperation({ summary: 'Update the Payment Method data' })
  @ApiOkResponse({ type: () => ReturnPaymentDto })
  async update(
    @Param('uuid') uuid: string,
    @Body(ValidationPipe) updatePaymentDto: UpdatePaymentDto,
  ) {
    return await this.paymentsService.update(uuid, updatePaymentDto);
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Delete a Payment Method' })
  @ApiOkResponse()
  async remove(@Param('uuid') uuid: string) {
    return await this.paymentsService.remove(uuid);
  }
}
