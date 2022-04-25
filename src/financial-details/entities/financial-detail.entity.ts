import { Financial } from 'src/financials/entities/financial.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
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
  })
  financial: Financial;

  @CreateDateColumn()
  created_at: Date;
}
