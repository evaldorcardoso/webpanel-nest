import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateItemsInventoryDto } from './dto/create-items-inventory.dto';
import { FindItemsInventoryQueryDto } from './dto/find-items-inventory-query.dto';
import { ReturnItemInventoryDto } from './dto/return-item-inventory.dto';
import { UpdateItemsInventoryDto } from './dto/update-items-inventory.dto';
import { ItemsInventory } from './entities/items-inventory.entity';
import { ItemsInventoryRepository } from './repositories/items-inventory.repository';

@Injectable()
export class ItemsInventoryService {
  constructor(
    @InjectRepository(ItemsInventoryRepository)
    private readonly itemsInventoryRepository: ItemsInventoryRepository,
  ) {}

  async create(
    company,
    createItemsInventoryDto: CreateItemsInventoryDto[],
  ): Promise<ItemsInventory[]> {
    return await this.itemsInventoryRepository.createItemInventory(
      company,
      createItemsInventoryDto,
    );
  }

  async findAll(
    queryDto: FindItemsInventoryQueryDto,
    company_uuid: string,
  ): Promise<{ itemsInventory: ReturnItemInventoryDto[]; total: number }> {
    const result = await this.itemsInventoryRepository.findItemsInventory(
      queryDto,
      company_uuid,
    );
    const itemsResult: ReturnItemInventoryDto[] = [];
    result.itemsInventory.forEach((item) => {
      itemsResult.push(new ReturnItemInventoryDto(item));
    });
    return {
      itemsInventory: itemsResult,
      total: result.total,
    };
  }

  async findOne(uuid: string, company_uuid: string): Promise<ItemsInventory> {
    const item = await this.itemsInventoryRepository.findOne({
      where: {
        uuid,
        company: company_uuid,
      },
      relations: ['item'],
    });
    if (!item) {
      throw new NotFoundException('Lançamento não encontrado');
    }
    return item;
  }

  async update(
    uuid: string,
    company_uuid: string,
    updateItemsInventoryDto: UpdateItemsInventoryDto,
  ): Promise<ItemsInventory> {
    const item = await this.itemsInventoryRepository.findOne({
      where: {
        uuid,
        company: company_uuid,
      },
      select: ['id'],
    });
    if (!item) {
      throw new NotFoundException('Lançamento não encontrado');
    }

    const result = await this.itemsInventoryRepository.update(
      item.id,
      updateItemsInventoryDto,
    );
    if (result.affected === 0) {
      throw new NotFoundException('Lançamento não encontrado');
    }
    return await this.itemsInventoryRepository.findOne(item.id, {
      relations: ['item'],
    });
  }

  async remove(uuid: string, company_uuid: string) {
    const item = await this.itemsInventoryRepository.findOne({
      where: {
        uuid,
        company: company_uuid,
      },
      select: ['id'],
    });
    if (!item) {
      throw new NotFoundException('Lançamento não encontrado');
    }
    await this.itemsInventoryRepository.delete(item.id);
  }
}
