import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://webpanel-nest:pcUBOEatn1bDvkm3@cluster0.hp7fa.mongodb.net/test',
    ),
    UsersModule,
    ItemsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
