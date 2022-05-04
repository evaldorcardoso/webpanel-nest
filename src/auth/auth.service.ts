import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from 'src/users/repositories/users.repository';
import { UserRole } from 'src/users/user-roles.enum';
import { CredentialsDto } from './dto/credentials.dto';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { randomBytes } from 'crypto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private JwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.password !== createUserDto.password_confirmation) {
      throw new UnprocessableEntityException('Senhas não conferem');
    }

    const user = await this.userRepository.createUser(
      createUserDto,
      UserRole.USER,
    );
    const mail = {
      to: user.email,
      from: this.configService.get('MAILER_FROM'),
      subject: 'Confirmação de cadastro',
      template: 'email-confirmation',
      context: {
        token: user.confirmation_token,
      },
    };
    await this.mailerService.sendMail(mail);
    return user;
  }

  async signIn(credentialsDto: CredentialsDto) {
    const user = await this.userRepository.checkCredentials(credentialsDto);

    if (user === null) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const jwtPayload = {
      uuid: user.uuid,
    };
    const token = await this.JwtService.sign(jwtPayload);
    let refresh_token = await this.JwtService.sign(jwtPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    refresh_token = await this.userRepository.updateRefreshToken(
      user.uuid,
      refresh_token,
    );

    return { token, refresh_token };
  }

  async refreshToken(user: User, refreshToken: string) {
    user = await this.userRepository.findOne({ uuid: user.uuid });
    if (!user.is_active) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const isValid = await this.userRepository.checkRefreshToken(
      user,
      refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException('Refresh Token inválido');
    }

    const jwtPayload = {
      uuid: user.uuid,
    };
    const token = await this.JwtService.sign(jwtPayload);

    return { token };
  }

  async removeRefreshToken(user: User) {
    await this.userRepository.update(user.id, {
      current_hashed_refresh_token: null,
    });
  }

  async confirmEmail(confirmation_token: string): Promise<User> {
    const user_id = await this.userRepository.findOne(
      { confirmation_token },
      { select: ['id'] },
    );
    const result = await this.userRepository.update(
      { confirmation_token },
      { confirmation_token: null, is_active: true },
    );
    if (result.affected === 0) {
      throw new NotFoundException('Token inválido');
    }
    return await this.userRepository.findOne(user_id);
  }

  async sendRecoverPasswordEmail(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ email });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    user.recover_token = randomBytes(32).toString('hex');
    await user.save();

    const mail = {
      to: user.email,
      from: 'suporte@evaldorc.com.br',
      subject: 'Recuperação de senha',
      template: 'recover-password',
      context: {
        token: user.recover_token,
      },
    };
    return await this.mailerService.sendMail(mail);
  }

  async changePassword(
    uuid: string,
    ChangePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { password, password_confirmation } = ChangePasswordDto;

    if (password != password_confirmation) {
      throw new UnprocessableEntityException('Senhas não conferem');
    }

    await this.userRepository.changePassword(uuid, password);
  }

  async resetPassword(
    recover_token: string,
    ChangePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne(
      { recover_token },
      { select: ['uuid'] },
    );
    if (!user) throw new NotFoundException('Token inválido');

    try {
      await this.changePassword(user.uuid.toString(), ChangePasswordDto);
    } catch (error) {
      throw error;
    }
  }
}
