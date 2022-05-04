import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
      defaultStrategy: 'jwt-refresh-token',
    });
  }

  async validate(request: Request, payload: { uuid: string }) {
    const { uuid } = payload;
    const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken(request);

    const user = await this.userService.getUserIfRefreshTokenMatches(
      refreshToken,
      uuid,
    );

    // const user = await this.userService.findUserByUuid(uuid);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return user;
  }
}
