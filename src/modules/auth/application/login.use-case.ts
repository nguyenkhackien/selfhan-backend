import { UnauthorizedException, Injectable } from "@nestjs/common";
import {
  PasswordHasherPort,
  RefreshSessionRepositoryPort,
  TokenServicePort,
  UserRepositoryPort,
} from "./auth.ports";
import { UserResponse } from "../domain/user.entity";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
  user: UserResponse;
  refreshToken: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly refreshSessionRepository: RefreshSessionRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      });
    }

    const isPasswordValid = await this.passwordHasher.verify(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      });
    }

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
