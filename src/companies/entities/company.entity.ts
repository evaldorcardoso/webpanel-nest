import { User } from '../../users/user.entity';
import {
  BaseEntity,
  Column,
  Entity,
  Generated,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['name'])
@Index(['id', 'uuid'])
export class Company extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @Column({ nullable: false, type: 'varchar', length: 100 })
  name: string;

  @ManyToMany(() => User)
  @JoinTable()
  has: User[];
}
