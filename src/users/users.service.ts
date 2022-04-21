import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from './repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from './user-roles.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { ReturnUserDto } from './dto/return-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
  ) {}

  async createAdminUser(createUserDto: CreateUserDto): Promise<ReturnUserDto> {
    if (createUserDto.password !== createUserDto.passwordConfirmation) {
      throw new UnprocessableEntityException('As senhas não conferem');
    } else {
      const user = await this.userRepository.createUser(
        createUserDto,
        UserRole.ADMIN,
      );
      return new ReturnUserDto(user);
    }
  }

  async findUserByUuid(uuid: string): Promise<ReturnUserDto> {
    const user = await this.userRepository.findOne(
      { uuid },
      {
        select: ['email', 'name', 'role', 'uuid', 'is_active'],
      },
    );

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return new ReturnUserDto(user);
  }

  async updateUser(updateUserDto: UpdateUserDto, uuid: string) {
    const result = await this.userRepository.update({ uuid }, updateUserDto);
    if (result.affected === 0) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const user = await this.findUserByUuid(uuid);
    return user;
  }

  async deleteUser(userUuid: string) {
    const result = await this.userRepository.delete({ uuid: userUuid });
    if (result.affected === 0) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }

  async findUsers(
    queryDto: FindUsersQueryDto,
  ): Promise<{ users: User[]; total: number }> {
    return await this.userRepository.findUsers(queryDto);
  }
}
