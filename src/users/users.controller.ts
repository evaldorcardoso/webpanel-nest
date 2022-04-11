import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UseGuards,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ReturnUserDto } from './dto/return-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'src/auth/role.decorator';
import { UserRole } from './user-roles.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from './entities/user.entity';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

@Controller('users')
@UseGuards(AuthGuard(), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Role(UserRole.ADMIN)
  async createAdminUser(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<ReturnUserDto> {
    const user = await this.usersService.createAdminUser(createUserDto);
    return {
      user,
      message: 'Usuário administrador criado com sucesso',
    };
  }

  @Get(':uuid')
  @Role(UserRole.ADMIN)
  async findUserByUuid(@Param('uuid') uuid): Promise<ReturnUserDto> {
    const user = await this.usersService.findUserByUuid(uuid);
    return {
      user,
      message: 'Usuário encontrado com sucesso',
    };
  }

  @Patch(':uuid')
  async updateUser(
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @GetUser() user: User,
    @Param('uuid') uuid: string,
  ) {
    if (user.role != UserRole.ADMIN && user.uuid.toString() != uuid) {
      throw new ForbiddenException(
        'Você não tem autorização para acessar este recurso',
      );
    } else {
      return this.usersService.updateUser(updateUserDto, uuid);
    }
  }

  @Delete(':uuid')
  @Role(UserRole.ADMIN)
  async deleteUser(@Param('uuid') uuid: string) {
    await this.usersService.deleteUser(uuid);
    return {
      message: 'Usuário deletado com sucesso',
    };
  }

  @Get()
  @Role(UserRole.ADMIN)
  async findUsers(@Query() query: FindUsersQueryDto) {
    const data = await this.usersService.findUsers(query);

    return {
      users: data.users,
      total: data.total,
      message: 'Usuários encontrados com sucesso',
    };
  }
}
