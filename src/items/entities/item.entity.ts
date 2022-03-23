import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ItemDocument = Item & Document;

@Schema()
export class Item {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  price: number;

  @Prop()
  imageUrl: string;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
