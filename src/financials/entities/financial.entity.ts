import { FinancialDetail } from 'src/financial-details/entities/financial-detail.entity';
import { User } from 'src/users/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
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
