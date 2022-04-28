import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['name'])
@Index(['id', 'uuid'])
export class Payment extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @Column({ nullable: false, type: 'varchar', length: 100 })
  name: string;

  @Column({ nullable: false, type: 'varchar', length: 50 })
  type: string;

  @CreateDateColumn()
  created_at: Date;
}
