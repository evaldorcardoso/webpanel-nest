import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/users.repository';
import { UserRole } from './user-roles.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserRepository)
    private usersRepository: UserRepository,
  ) {}

  async createAdminUser(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.password !== createUserDto.passwordConfirmation) {
      throw new UnprocessableEntityException('As senhas não conferem');
    } else {
      return this.usersRepository.createUser(createUserDto, UserRole.ADMIN);
    }
  }

  async findUserByUuid(userUuid: string): Promise<User> {
    const user = await this.usersRepository.findOne(userUuid, {
      select: ['email', 'name', 'role', 'uuid'],
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return user;
  }

  async updateUser(updateUserDto: UpdateUserDto, uuid: string): Promise<User> {
    const user = await this.findUserByUuid(uuid);
    const { name, email, role, is_active } = updateUserDto;
    user.name = name ? name : user.name;
    user.email = email ? email : user.email;
    user.role = role ? role : user.role;
    user.is_active = is_active ? is_active : user.is_active;
    try {
      await user.save();
      return user;
    } catch (error) {
      throw new InternalServerErrorException('Erro ao atualizar usuário');
    }
  }

  async deleteUser(userUuid: string) {
    const result = await this.usersRepository.delete({ uuid: userUuid });
    if (result.affected === 0) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }

  async findUsers(
    queryDto: FindUsersQueryDto,
  ): Promise<{ users: User[]; total: number }> {
    const users = await this.usersRepository.findUsers(queryDto);
    return users;
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: string): Promise<User> {
    return this.usersRepository.findOne(id);
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    // return this.userModel.findByIdAndUpdate(
    //   {
    //     _id: id,
    //   },
    //   {
    //     $set: updateUserDto,
    //   },
    //   { new: true },
    // );
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
