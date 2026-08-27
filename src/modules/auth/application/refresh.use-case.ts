import { UnauthorizedException, Injectable } from "@nestjs/common";
import {
  RefreshSessionRepositoryPort,
  TokenServicePort,
  UserRepositoryPort,
} from "./auth.ports";
import { UserResponse } from "../domain/user.entity";

export interface RefreshInput {
  refreshToken?: string;
}

export interface RefreshOutput {
  accessToken: string;
  user: UserResponse;
  refreshToken: string;
}

@Injectable()
export class RefreshUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly refreshSessionRepository: RefreshSessionRepositoryPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(input: RefreshInput): Promise<RefreshOutput> {
    if (!input.refreshToken) {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token is required.",
      });
    }

    const tokenHash = this.tokenService.hashToken(input.refreshToken);

    const session =
      await this.refreshSessionRepository.findByTokenHash(tokenHash);

    if (!session) {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token.",
      });
    }

    if (session.revokedAt) {
      await this.refreshSessionRepository.revokeAllForUser(session.userId);
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token has been revoked.",
      });
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token has expired.",
      });
    }

    const user = await this.userRepository.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "User not found.",
      });
    }

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    const accessToken = this.tokenService.generateAccessToken(userResponse);
    const newRefreshToken = this.tokenService.generateRefreshToken();
    const newTokenHash = this.tokenService.hashToken(newRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const rotatedSession = await this.refreshSessionRepository.rotate(
      session.id,
      {
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt,
      },
    );
    if (!rotatedSession) {
      await this.refreshSessionRepository.revokeAllForUser(session.userId);
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token has been revoked.",
      });
    }

    return {
      accessToken,
      user: userResponse,
      refreshToken: newRefreshToken,
    };
  }
}
