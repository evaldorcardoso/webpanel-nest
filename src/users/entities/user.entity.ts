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
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Financial } from '../../financials/entities/financial.entity';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user-roles.enum';

@Entity()
@Unique(['email'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Generated('uuid')
  @ApiProperty()
  uuid: string;

  @Column({ nullable: false, type: 'varchar', length: 100 })
  @ApiProperty()
  email: string;

  @Column({ nullable: false, type: 'varchar', length: 100 })
  password: string;

  @Column({ nullable: false, type: 'varchar', length: 100 })
  @ApiProperty()
  name: string;

  @Column({ type: 'simple-enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: false, default: true })
  @ApiProperty()
  is_active: boolean;

  @Column({ nullable: false, type: 'varchar', length: 100 })
  salt: string;

  @Column({ nullable: true, type: 'varchar', length: 64 })
  confirmation_token: string;

  @Column({ nullable: true, type: 'varchar', length: 64 })
  recover_token: string;

  @CreateDateColumn()
  @ApiProperty()
  created_at: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updated_at: Date;

  @OneToMany(() => Financial, (financial) => financial.user)
  financials: User[];

  async checkPassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
