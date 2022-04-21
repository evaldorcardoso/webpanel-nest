import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../user-roles.enum';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({
    message: 'Informe um nome de usuário válido',
  })
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail(
    {},
    {
      message: 'Informe um email válido',
    },
  )
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  role: UserRole;

  @ApiProperty({ required: false })
  @IsOptional()
  is_active: boolean;
}
