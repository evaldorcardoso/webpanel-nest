import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
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
