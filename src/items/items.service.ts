import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateItemDto } from './dto/create-item.dto';
import { FindItemsQueryDto } from './dto/find-items-query.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';
import { ItemRepository } from './repositories/items.repository';

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

  update(id: number, updateItemDto: UpdateItemDto) {
    return `This action updates a #${id} item`;
  }

  remove(id: number) {
    return `This action removes a #${id} item`;
  }
}
