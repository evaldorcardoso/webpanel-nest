import { FinancialDetail } from '../../financial-details/financial-detail.entity';
import { User } from '../../users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['id', 'uuid'])
export class Financial extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @Column({ nullable: false, type: 'varchar', length: 100 })
  company: string;

  @ManyToOne(() => User, (user) => user.financials)
  user: User;

  @OneToMany(
    () => FinancialDetail,
    (financialDetail) => financialDetail.financial,
  )
  financialDetails: FinancialDetail[];

  @CreateDateColumn()
  created_at: Date;
}
