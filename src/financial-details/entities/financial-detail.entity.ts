import { Financial } from '../../financials/entities/financial.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['id', 'uuid'])
export class FinancialDetail extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @Column({ nullable: false, type: 'decimal' })
  value: number;

  @ManyToOne(() => Financial, (financial) => financial.financialDetails, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  financial: Financial;

  @CreateDateColumn()
  created_at: Date;
}
