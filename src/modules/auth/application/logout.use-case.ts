import { Injectable } from "@nestjs/common";
import { RefreshSessionRepositoryPort, TokenServicePort } from "./auth.ports";

export interface LogoutInput {
  refreshToken?: string;
}

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly refreshSessionRepository: RefreshSessionRepositoryPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    if (!input.refreshToken) {
      return;
    }

    const tokenHash = this.tokenService.hashToken(input.refreshToken);
    const session =
      await this.refreshSessionRepository.findByTokenHash(tokenHash);

    if (session && !session.revokedAt) {
      await this.refreshSessionRepository.revoke(session.id);
    }
  }
}
