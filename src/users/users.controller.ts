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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { UserDto } from './dto/user.dto';

@Controller('users')
@UseGuards(AuthGuard(), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Role(UserRole.ADMIN)
  @ApiCreatedResponse({ type: UserDto })
  @ApiBearerAuth()
  async createAdminUser(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<UserDto> {
    return await this.usersService.createAdminUser(createUserDto);
  }

  @Get(':uuid')
  @Role(UserRole.ADMIN)
  @ApiOkResponse({ type: UserDto })
  @ApiBearerAuth()
  async findUserByUuid(@Param('uuid') uuid): Promise<UserDto> {
    return await this.usersService.findUserByUuid(uuid);
  }

  @Patch(':uuid')
  @ApiOkResponse({ type: UserDto })
  @ApiBearerAuth()
  async updateUser(
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @GetUser() user: User,
    @Param('uuid') uuid: string,
  ): Promise<UserDto> {
    if (user.role != UserRole.ADMIN && user.uuid.toString() != uuid) {
      throw new ForbiddenException(
        'Você não tem autorização para acessar este recurso',
      );
    } else {
      return this.usersService.updateUser(updateUserDto, uuid);
    }
  }

  @Delete(':uuid')
  @ApiOkResponse({ description: 'Usuário deletado com sucesso' })
  @ApiBearerAuth()
  @Role(UserRole.ADMIN)
  async deleteUser(@Param('uuid') uuid: string) {
    await this.usersService.deleteUser(uuid);
    return {
      message: 'Usuário deletado com sucesso',
    };
  }

  @Get()
  @ApiOkResponse({ type: ReturnUserDto })
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
