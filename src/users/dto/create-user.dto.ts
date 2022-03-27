import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({
    message: 'Informe um endereço de email válido',
  })
  @IsEmail(
    {},
    {
      message: 'Informe um endereço de email válido',
    },
  )
  @MaxLength(100, {
    message: 'O email não pode ter mais de 100 caracteres',
  })
  email: string;

  @IsNotEmpty({
    message: 'Informe o nome do usuário',
  })
  @MaxLength(100, {
    message: 'O nome não pode ter mais de 100 caracteres',
  })
  name: string;

  @IsNotEmpty({
    message: 'Informe a senha do usuário',
  })
  @MinLength(6, {
    message: 'A senha deve ter pelo menos 6 caracteres',
  })
  password: string;

  @IsNotEmpty({
    message: 'A confirmação da senha não pode ser vazia',
  })
  @MinLength(6, {
    message: 'A confirmação da senha deve ter pelo menos 6 caracteres',
  })
  passwordConfirmation: string;
}
