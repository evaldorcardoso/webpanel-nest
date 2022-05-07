import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { FindPaymentsQueryDto } from './dto/find-payments-query.dto';
import { Payment } from './payment.entity';

@EntityRepository(Payment)
export class PaymentRepository extends Repository<Payment> {
  async findPayments(
    queryDto: FindPaymentsQueryDto,
  ): Promise<{ payments: Payment[]; total: number }> {
    queryDto.page = queryDto.page === undefined ? 1 : queryDto.page;
    queryDto.limit = queryDto.limit > 100 ? 100 : queryDto.limit;
    queryDto.limit = queryDto.limit === undefined ? 100 : queryDto.limit;

    const { name, type } = queryDto;
    const query = this.createQueryBuilder('payment');

    if (name) {
      query.andWhere('payment.name LIKE :name', { name: `%${name}%` });
    }

    if (type) {
      query.andWhere('payment.type LIKE :type', { type: `%${type}%` });
    }

    query.skip((queryDto.page - 1) * queryDto.limit);
    query.take(+queryDto.limit);
    query.orderBy(queryDto.sort ? JSON.parse(queryDto.sort) : undefined);
    query.select(['payment.uuid', 'payment.name', 'payment.type']);

    const [payments, total] = await query.getManyAndCount();

    return { payments, total };
  }

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { name, type } = createPaymentDto;
    const payment = new Payment();
    payment.name = name;
    payment.type = type;

    try {
      await payment.save();
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException('Payment already exists');
      } else {
        throw new InternalServerErrorException(
          'Erro ao salvar o pagamento no banco de dados',
        );
      }
    }

    return payment;
  }
}
