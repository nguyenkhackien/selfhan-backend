import { UnauthorizedException } from "@nestjs/common";
import {
  RefreshSessionRepositoryPort,
  TokenServicePort,
  UserRepositoryPort,
} from "./auth.ports";
import { RefreshUseCase } from "./refresh.use-case";
import { UserRole } from "../domain/user.entity";

describe("RefreshUseCase", () => {
  it("revokes all sessions when a revoked refresh token is reused", async () => {
    const revokeAllForUser = jest.fn();
    const sessions = {
      findByTokenHash: jest.fn().mockResolvedValue({
        id: "session-1",
        userId: "user-1",
        tokenHash: "hash",
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        revokedAt: new Date("2026-01-01T00:00:00.000Z"),
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
      }),
      revokeAllForUser,
      rotate: jest.fn(),
    } as unknown as RefreshSessionRepositoryPort;
    const tokens = {
      hashToken: jest.fn().mockReturnValue("hash"),
    } as unknown as TokenServicePort;
    const useCase = new RefreshUseCase(
      {} as UserRepositoryPort,
      sessions,
      tokens,
    );

    await expect(
      useCase.execute({ refreshToken: "old-token" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(revokeAllForUser).toHaveBeenCalledWith("user-1");
  });

  it("rotates the session atomically before returning new tokens", async () => {
    const rotate = jest.fn().mockResolvedValue({ id: "session-2" });
    const sessions = {
      findByTokenHash: jest.fn().mockResolvedValue({
        id: "session-1",
        userId: "user-1",
        tokenHash: "hash",
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        revokedAt: null,
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
      }),
      rotate,
    } as unknown as RefreshSessionRepositoryPort;
    const users = {
      findById: jest.fn().mockResolvedValue({
        id: "user-1",
        email: "learner@example.com",
        passwordHash: "hash",
        role: UserRole.LEARNER,
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
      }),
    } as unknown as UserRepositoryPort;
    const tokens = {
      hashToken: jest
        .fn()
        .mockReturnValueOnce("old-hash")
        .mockReturnValueOnce("new-hash"),
      generateAccessToken: jest.fn().mockReturnValue("new-access-token"),
      generateRefreshToken: jest.fn().mockReturnValue("new-refresh-token"),
    } as unknown as TokenServicePort;

    const result = await new RefreshUseCase(users, sessions, tokens).execute({
      refreshToken: "old-token",
    });

    expect(rotate).toHaveBeenCalledWith(
      "session-1",
      expect.objectContaining({
        userId: "user-1",
        tokenHash: "new-hash",
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      }),
    );
  });
});
