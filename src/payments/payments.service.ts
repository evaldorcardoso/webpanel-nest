import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { PaymentRepository } from './repositories/payment.repository';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentRepository)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    return await this.paymentRepository.create(createPaymentDto);
  }

  findAll() {
    return `This action returns all payments`;
  }

  async findOne(uuid: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ uuid });
    if (!payment) {
      throw new NotFoundException('Forma de Pagamento não encontrada');
    }
    return payment;
  }

  async update(
    uuid: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const result = await this.paymentRepository.update(
      { uuid },
      updatePaymentDto,
    );
    if (result.affected === 0) {
      throw new NotFoundException('Forma de Pagamento não encontrada');
    }
    const payment = await this.paymentRepository.findOne({ uuid });
    return payment;
  }

  async remove(uuid: string) {
    const result = await this.paymentRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException('Forma de Pagamento não encontrada');
    }
  }
}
