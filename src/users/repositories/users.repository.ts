import { EntityRepository, Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserRole } from '../user-roles.enum';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CredentialsDto } from 'src/auth/dto/credentials.dto';
import { FindUsersQueryDto } from '../dto/find-users-query.dto';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async findUsers(
    queryDto: FindUsersQueryDto,
  ): Promise<{ users: User[]; total: number }> {
    queryDto.is_active =
      queryDto.is_active === undefined ? true : queryDto.is_active;
    queryDto.page = queryDto.page === undefined ? 1 : queryDto.page;
    queryDto.limit = queryDto.limit > 100 ? 100 : queryDto.limit;
    queryDto.limit = queryDto.limit === undefined ? 100 : queryDto.limit;

    const { email, name, is_active, role } = queryDto;
    const query = this.createQueryBuilder('user');
    query.where('user.is_active = :is_active', { is_active });

    if (email) {
      query.andWhere('user.email LIKE :email', { email: `%${email}%` });
    }

    if (name) {
      query.andWhere('user.name LIKE :name', { name: `%${name}%` });
    }

    if (role) {
      query.andWhere('user.role = :role', { role });
    }
    query.skip((queryDto.page - 1) * queryDto.limit);
    query.take(+queryDto.limit);
    query.orderBy(queryDto.sort ? JSON.parse(queryDto.sort) : undefined);
    query.select([
      'user.uuid',
      'user.name',
      'user.email',
      'user.role',
      'user.is_active',
    ]);

    const [users, total] = await query.getManyAndCount();

    return { users, total };
  }

  async createUser(
    createUserDto: CreateUserDto,
    role: UserRole,
  ): Promise<User> {
    const { email, name, password } = createUserDto;

    const user = this.create();
    user.email = email;
    user.name = name;
    user.role = role;
    user.is_active = false;
    user.confirmation_token = crypto.randomBytes(32).toString('hex');
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);

    try {
      await user.save();
      return user;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException('Endereço de email já cadastrado');
      } else {
        throw new InternalServerErrorException(
          'Erro ao salvar usuário no banco de dados',
        );
      }
    }
  }

  async changePassword(uuid: string, password: string) {
    const user = await this.findOne({ uuid });
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);
    user.recover_token = null;
    await user.save();
  }

  async checkCredentials(CredentialsDto: CredentialsDto): Promise<User> {
    const { email, password } = CredentialsDto;
    const user = await this.findOne({ email });

    if (user && (await user.checkPassword(password))) {
      return user;
    } else {
      return null;
    }
  }

  async checkRefreshToken(user: User, refreshToken: string): Promise<boolean> {
    // console.log(user.current_hashed_refresh_token);
    return await bcrypt.compare(
      refreshToken,
      user.current_hashed_refresh_token,
    );
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, uuid: string) {
    const user = await this.findOne({ uuid });

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.current_hashed_refresh_token,
    );

    if (isRefreshTokenValid) {
      return user;
    }
  }

  async updateRefreshToken(
    uuid: string,
    refresh_token: string,
  ): Promise<string> {
    const user = await this.findOne({ uuid });
    user.current_hashed_refresh_token = await this.hashPassword(
      refresh_token,
      user.salt,
    );
    await user.save();
    return user.current_hashed_refresh_token;
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
}
