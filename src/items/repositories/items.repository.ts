import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { CreateItemDto } from '../dto/create-item.dto';
import { FindItemsQueryDto } from '../dto/find-items-query.dto';
import { Item } from '../entities/item.entity';

@EntityRepository(Item)
export class ItemRepository extends Repository<Item> {
  async findItems(
    queryDto: FindItemsQueryDto,
  ): Promise<{ items: Item[]; total: number }> {
    queryDto.is_active =
      queryDto.is_active === undefined ? true : queryDto.is_active;
    queryDto.page = queryDto.page === undefined ? 1 : queryDto.page;
    queryDto.limit = queryDto.limit > 100 ? 100 : queryDto.limit;
    queryDto.limit = queryDto.limit === undefined ? 100 : queryDto.limit;

    const { name, price, is_active } = queryDto;
    const query = this.createQueryBuilder('item');
    query.where('item.is_active = :is_active', { is_active });

    if (name) {
      query.andWhere('item.name LIKE :name', { name: `%${name}%` });
    }

    if (price) {
      query.andWhere('item.price = :price', { price });
    }

    query.skip((queryDto.page - 1) * queryDto.limit);
    query.take(+queryDto.limit);
    query.orderBy(queryDto.sort ? JSON.parse(queryDto.sort) : undefined);
    query.select(['item.uuid', 'item.name', 'item.price', 'item.is_active']);

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }

  async createItem(createItemDto: CreateItemDto): Promise<Item> {
    const { name, price, is_active } = createItemDto;
    const item = new Item();
    item.name = name;
    item.price = price;
    item.is_active = is_active ? is_active : true;

    try {
      return await item.save();
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException('Item já cadastrado');
      } else {
        throw new InternalServerErrorException(
          'Erro ao salvar item no banco de dados',
        );
      }
    }
  }
}
