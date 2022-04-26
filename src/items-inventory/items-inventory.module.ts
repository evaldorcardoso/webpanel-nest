import { Module } from '@nestjs/common';
import { ItemsInventoryService } from './items-inventory.service';
import { ItemsInventoryController } from './items-inventory.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsInventoryRepository } from './repositories/items-inventory.repository';
import { ItemRepository } from 'src/items/repositories/items.repository';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemsInventoryRepository, ItemRepository]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ItemsInventoryController],
  providers: [ItemsInventoryService],
})
export class ItemsInventoryModule {}
