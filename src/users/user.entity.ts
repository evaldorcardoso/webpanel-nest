import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  Unique,
  Generated,
  OneToMany,
  Index,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Financial } from '../financials/financial.entity';
import { UserRole } from './user-roles.enum';

@Entity()
@Unique(['email'])
@Index(['id', 'uuid'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @Column({ nullable: false, type: 'varchar', length: 100 })
  email: string;

  @Column({ nullable: false, type: 'varchar', length: 100 })
  password: string;

  @Column({ nullable: false, type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'simple-enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: false, default: true })
  is_active: boolean;

  @Column({ nullable: false, type: 'varchar', length: 100 })
  salt: string;

  @Column({ nullable: true, type: 'varchar', length: 64 })
  confirmation_token: string;

  @Column({ nullable: true, type: 'varchar', length: 64 })
  recover_token: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Financial, (financial) => financial.user)
  financials: User[];

  async checkPassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
