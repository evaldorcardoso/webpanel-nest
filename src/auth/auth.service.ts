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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private JwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.password !== createUserDto.passwordConfirmation) {
      throw new UnprocessableEntityException('Senhas não conferem');
    } else {
      const user = await this.userRepository.createUser(
        createUserDto,
        UserRole.USER,
      );
      const mail = {
        to: user.email,
        from: 'suporte@evaldorc.com.br',
        subject: 'Confirmação de cadastro',
        template: 'email-confirmation',
        context: {
          token: user.confirmation_token,
        },
      };
      await this.mailerService.sendMail(mail);
      return user;
    }
  }

  async signIn(credentialsDto: CredentialsDto) {
    const user = await this.userRepository.checkCredentials(credentialsDto);

    if (user === null) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const jwtPayload = {
      id: user.id,
    };
    const token = await this.JwtService.sign(jwtPayload);

    return { token };
  }

  async confirmEmail(confirmation_token: string): Promise<void> {
    const result = await this.userRepository.update(
      { confirmation_token },
      { confirmation_token: null },
    );
    if (result.affected === 0) {
      throw new NotFoundException('Token inválido');
    }
  }

  async sendRecoverPasswordEmail(email: string): Promise<void> {
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
    await this.mailerService.sendMail(mail);
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
