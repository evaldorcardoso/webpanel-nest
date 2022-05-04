import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ReturnUserDto } from 'src/users/dto/return-user.dto';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/user-roles.enum';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CredentialsDto } from './dto/credentials.dto';
import { ReturnAuthDto } from './dto/return-auth.dto';
import { ReturnMessageDto } from './dto/return-message.dto';
import { GetUser } from './get-user.decorator';
import { JwtGuard } from './jwt.guard';
import JwtRefreshGuard from './jwt.refresh.guard';
import { Role } from './role.decorator';
import { RolesGuard } from './roles.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Register a new User and send an email registration',
  })
  @ApiCreatedResponse({ type: ReturnUserDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Role(UserRole.ADMIN)
  async signUp(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<ReturnUserDto> {
    const user = await this.authService.signUp(createUserDto);
    return new ReturnUserDto(user);
  }

  @Post('/signin')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login User' })
  @ApiOkResponse({ type: ReturnAuthDto })
  async signIn(
    @Body(ValidationPipe) credentialsDto: CredentialsDto,
  ): Promise<ReturnAuthDto> {
    return await this.authService.signIn(credentialsDto);
  }

  @Post('/refresh-token')
  @UseGuards(AuthGuard())
  async refreshToken(
    @GetUser() user: User,
    @Body('refresh_token') refreshToken: string,
  ) {
    return await this.authService.refreshToken(user, refreshToken);
  }

  @Get('/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logged User' })
  @ApiOkResponse({ type: ReturnUserDto })
  @UseGuards(AuthGuard())
  getMe(@GetUser() user: User) {
    return new ReturnUserDto(user);
  }

  @Get(':token')
  @ApiOperation({ summary: 'Activate the user registration' })
  @ApiParam({ name: 'token', description: 'Token received via email' })
  @ApiOkResponse({ type: ReturnUserDto })
  async confirmEmail(@Param('token') token: string): Promise<ReturnUserDto> {
    const user = await this.authService.confirmEmail(token);
    return new ReturnUserDto(user);
  }

  @Post('/send-recover-email')
  @HttpCode(200)
  @ApiOperation({ summary: 'Send recover email' })
  @ApiOkResponse({ type: ReturnMessageDto })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
      },
    },
  })
  async sendRecoverPasswordEmail(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    const result = await this.authService.sendRecoverPasswordEmail(email);
    if (!result) return { message: 'Email não encontrado' };
    return { message: 'Email enviado com sucesso' };
  }

  @Patch('/reset-password/:token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset user password' })
  @ApiParam({ name: 'token', description: 'Token received via email' })
  @ApiOkResponse({ type: ReturnMessageDto })
  async resetPassword(
    @Param('token') token: string,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(token, changePasswordDto);
    return {
      message: 'Senha alterada com sucesso',
    };
  }

  @Patch(':uuid/change-password')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password of a logged User' })
  @ApiOkResponse({ type: ReturnMessageDto })
  @UseGuards(AuthGuard())
  async changePassword(
    @Param('uuid') uuid: string,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
    @GetUser() user: User,
  ): Promise<{ message: string }> {
    if (user.role !== UserRole.ADMIN && user.uuid.toString() !== uuid)
      throw new UnauthorizedException(
        'Você não tem permissão para realizar esta operação',
      );
    await this.authService.changePassword(uuid, changePasswordDto);
    return {
      message: 'Senha alterada com sucesso',
    };
  }
}
