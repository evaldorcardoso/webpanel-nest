import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item, ItemDocument } from './entities/item.entity';

@Injectable()
export class ItemsService {
  constructor(@InjectModel(Item.name) private itemModel: Model<ItemDocument>) {}

  create(createItemDto: CreateItemDto) {
    const item = new this.itemModel(createItemDto);
    return item.save();
  }

  findAll() {
    return this.itemModel.find();
  }

  findOne(id: string) {
    return this.itemModel.findById(id);
  }

  update(id: string, updateItemDto: UpdateItemDto) {
    return this.itemModel.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        $set: updateItemDto,
      },
      { new: true },
    );
  }

  remove(id: string) {
    return this.itemModel.deleteOne({ _id: id }).exec();
  }
}
