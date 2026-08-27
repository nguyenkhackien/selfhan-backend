import { IsEmail, IsString, Length } from "class-validator";
import { UserRole } from "../domain/user.entity";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(12, 128)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(12, 128)
  password!: string;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  role!: UserRole;
  createdAt!: Date;
}

export class AuthResponseDto {
  accessToken!: string;
  user!: UserResponseDto;
}
