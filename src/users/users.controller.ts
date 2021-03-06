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
  UnprocessableEntityException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ReturnUserDto } from './dto/return-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../auth/role.decorator';
import { UserRole } from './user-roles.enum';
import { RolesGuard } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from './user.entity';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ReturnFindUsersDto } from './dto/return-find-users.dto';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard(), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Role(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new Admin User' })
  @ApiCreatedResponse({ type: ReturnUserDto })
  async createAdminUser(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<ReturnUserDto> {
    return await this.usersService.createAdminUser(createUserDto);
  }

  @Get(':uuid')
  @Role(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get an user by uuid' })
  @ApiOkResponse({ type: ReturnUserDto })
  async findUserByUuid(@Param('uuid') uuid): Promise<ReturnUserDto> {
    return await this.usersService.findUserByUuid(uuid);
  }

  @Patch(':uuid')
  @ApiOperation({ summary: 'Update the user data' })
  @ApiOkResponse({ type: ReturnUserDto })
  async updateUser(
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @GetUser() user: User,
    @Param('uuid') uuid: string,
  ): Promise<ReturnUserDto> {
    if (user.role != UserRole.ADMIN) {
      if (user.uuid.toString() != uuid || updateUserDto.role) {
        throw new ForbiddenException(
          'Voc?? n??o tem autoriza????o para acessar este recurso',
        );
      }
    }

    if (!user.is_active && updateUserDto.is_active) {
      throw new UnprocessableEntityException(
        'Voc?? n??o pode ativar um usu??rio por este recurso',
      );
    }

    return await this.usersService.updateUser(updateUserDto, uuid);
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Delete an user' })
  @ApiOkResponse()
  @Role(UserRole.ADMIN)
  async deleteUser(@Param('uuid') uuid: string) {
    await this.usersService.deleteUser(uuid);
    return {
      message: 'Usu??rio deletado com sucesso',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Find users by filter query' })
  @ApiOkResponse({ type: ReturnFindUsersDto })
  @Role(UserRole.ADMIN)
  async findUsers(@Query() query: FindUsersQueryDto) {
    const data = await this.usersService.findUsers(query);

    return {
      users: data.users,
      total: data.total,
    };
  }
}
