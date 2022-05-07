import { Item } from '../../items/item.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index(['id', 'uuid'])
export class ItemsInventory extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @Column({ nullable: false, type: 'varchar' })
  company: string;

  @Column({ nullable: false, type: 'decimal' })
  quantity: number;

  @ManyToOne(() => Item, (item) => item.itemsInventory, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  item: Item;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
