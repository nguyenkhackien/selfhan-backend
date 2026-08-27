import { ConflictException, Injectable } from "@nestjs/common";
import {
  PasswordHasherPort,
  RefreshSessionRepositoryPort,
  TokenServicePort,
  UserRepositoryPort,
} from "./auth.ports";
import { UserResponse } from "../domain/user.entity";

export interface RegisterInput {
  email: string;
  password: string;
}

export interface RegisterOutput {
  accessToken: string;
  user: UserResponse;
  refreshToken: string;
}

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly refreshSessionRepository: RefreshSessionRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException({
        code: "EMAIL_ALREADY_REGISTERED",
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({
      email: normalizedEmail,
      password: passwordHash,
    });

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    const accessToken = this.tokenService.generateAccessToken(userResponse);
    const refreshToken = this.tokenService.generateRefreshToken();
    const tokenHash = this.tokenService.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshSessionRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return {
      accessToken,
      user: userResponse,
      refreshToken,
    };
  }
}
