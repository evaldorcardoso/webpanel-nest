import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemRepository } from './items.repository';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemRepository]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
