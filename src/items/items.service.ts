import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateItemDto } from './dto/create-item.dto';
import { FindItemsQueryDto } from './dto/find-items-query.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './item.entity';
import { ItemRepository } from './items.repository';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(ItemRepository)
    private readonly itemRepository: ItemRepository,
  ) {}
  async createItem(createItemDto: CreateItemDto): Promise<Item> {
    return await this.itemRepository.createItem(createItemDto);
  }

  async findAll(
    queryDto: FindItemsQueryDto,
  ): Promise<{ items: Item[]; total: number }> {
    return await this.itemRepository.findItems(queryDto);
  }

  async findOne(uuid: string): Promise<Item> {
    const item = await this.itemRepository.findOne({ uuid });

    if (!item) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return item;
  }

  async update(uuid: string, updateItemDto: UpdateItemDto): Promise<Item> {
    const result = await this.itemRepository.update({ uuid }, updateItemDto);
    if (result.affected === 0) {
      throw new NotFoundException('Item não encontrado');
    }
    const item = await this.findOne(uuid);
    return item;
  }

  async remove(uuid: string) {
    const result = await this.itemRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException('Item não encontrado');
    }
  }
}
