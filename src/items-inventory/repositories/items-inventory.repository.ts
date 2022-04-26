import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Item } from 'src/items/entities/item.entity';
import { EntityRepository, Repository } from 'typeorm';
import { CreateItemsInventoryDto } from '../dto/create-items-inventory.dto';
import { FindItemsInventoryQueryDto } from '../dto/find-items-inventory-query.dto';
import { ItemsInventory } from '../entities/items-inventory.entity';

@EntityRepository(ItemsInventory)
export class ItemsInventoryRepository extends Repository<ItemsInventory> {
  async findItemsInventory(
    queryDto: FindItemsInventoryQueryDto,
    company_uuid,
  ): Promise<{ itemsInventory: ItemsInventory[]; total: number }> {
    queryDto.page = queryDto.page === undefined ? 1 : queryDto.page;
    queryDto.limit = queryDto.limit > 100 ? 100 : queryDto.limit;
    queryDto.limit = queryDto.limit === undefined ? 100 : queryDto.limit;

    const { item, quantity, created_at } = queryDto;
    const query = this.createQueryBuilder('items_inventory');
    query.andWhere('items_inventory.company LIKE :company', {
      company: `%${company_uuid}%`,
    });

    if (quantity) {
      query.andWhere('items_inventory.quantity = :quantity', { quantity });
    }
    query.skip((queryDto.page - 1) * queryDto.limit);
    query.take(+queryDto.limit);
    query.orderBy(queryDto.sort ? JSON.parse(queryDto.sort) : undefined);
    if (item) {
      const item_id = await Item.findOne({ uuid: item }, { select: ['id'] });
      query.leftJoinAndSelect(
        'items_inventory.item',
        'item',
        'item.id = items_inventory.itemId AND items_inventory.itemId = ' +
          item_id.id,
      );
    } else {
      query.leftJoinAndSelect('items_inventory.item', 'item');
    }
    if (created_at) {
      query.andWhere('items_inventory.created_at LIKE :created_at', {
        created_at: `%${created_at}%`,
      });
    }
    query.select([
      'items_inventory.id',
      'items_inventory.uuid',
      'items_inventory.quantity',
      'items_inventory.created_at',
      'items_inventory.updated_at',
      'item.uuid',
    ]);

    const [itemsInventory, total] = await query.getManyAndCount();

    return { itemsInventory, total };
  }

  async createItemInventory(
    company_uuid,
    createItemsInventoryDtos: CreateItemsInventoryDto[],
  ): Promise<ItemsInventory[]> {
    const itemsInventorySaved: ItemsInventory[] = [];
    for (let i = 0; i < createItemsInventoryDtos.length; i++) {
      const { item, quantity } = createItemsInventoryDtos[i];
      const item_found = await Item.findOne({ uuid: item });

      if (!item_found) {
        throw new NotFoundException('Item não encontrado');
      }

      const itemsInventory = this.create();
      itemsInventory.quantity = quantity;
      itemsInventory.company = company_uuid;
      itemsInventory.item = item_found;

      try {
        await itemsInventory.save();
        itemsInventorySaved.push(itemsInventory);
      } catch (error) {
        throw new InternalServerErrorException(
          'Erro ao salvar item de inventário',
        );
      }
    }
    return itemsInventorySaved;
  }
}
