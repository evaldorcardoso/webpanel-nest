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
  Query,
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
import { ReturnFindPaymentsDto } from './dto/return-find-payments.dto';
import { FindPaymentsQueryDto } from './dto/find-payments-query.dto';

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
    return new ReturnPaymentDto(
      await this.paymentsService.create(createPaymentDto),
    );
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get a Payment Method by UUID' })
  @ApiOkResponse({ type: () => ReturnPaymentDto })
  async findOne(@Param('uuid') uuid: string) {
    return await this.paymentsService.findOne(uuid);
  }

  @Get()
  @ApiOperation({ summary: 'Find payment methods by filter query' })
  @ApiOkResponse({ type: () => ReturnFindPaymentsDto })
  async findAll(@Query() query: FindPaymentsQueryDto) {
    const data = await this.paymentsService.findAll(query);

    return {
      payments: data.payments,
      total: data.total,
    };
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
