import { IsString, IsUUID, Length } from 'class-validator';

export class VerifyTwoFactorDto {
  @IsUUID()
  userId: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

export class DisableTwoFactorDto {
  @IsString()
  password: string;
}
