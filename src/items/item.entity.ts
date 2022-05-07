import { ItemsInventory } from '../items-inventory/entities/items-inventory.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique(['name'])
@Index(['id', 'uuid', 'is_active'])
export class Item extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @Column({ nullable: false, type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: false, default: true, type: 'boolean' })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ItemsInventory, (itemsInventory) => itemsInventory.item)
  itemsInventory: ItemsInventory[];
}
