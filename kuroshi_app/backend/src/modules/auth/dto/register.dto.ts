import { IsEmail, IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'otaku_kun' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'El nombre de usuario solo puede contener letras, números y guiones bajos',
  })
  username: string;

  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'MiContrasena123' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100)
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}