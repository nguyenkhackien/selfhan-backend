import { ConflictException } from "@nestjs/common";
import {
  PasswordHasherPort,
  RefreshSessionRepositoryPort,
  TokenServicePort,
  UserRepositoryPort,
} from "./auth.ports";
import { RegisterUseCase } from "./register.use-case";
import { User, UserRole } from "../domain/user.entity";

describe("RegisterUseCase", () => {
  const createdAt = new Date("2026-01-01T00:00:00.000Z");
  const user: User = {
    id: "user-1",
    email: "learner@example.com",
    passwordHash: "hash",
    role: UserRole.LEARNER,
    createdAt,
  };

  it("normalizes an email and creates a hashed refresh session", async () => {
    const findByEmail = jest.fn().mockResolvedValue(null);
    const createUser = jest.fn().mockResolvedValue(user);
    const createSession = jest.fn();
    const hashPassword = jest.fn().mockResolvedValue("hash");
    const users = {
      findByEmail,
      create: createUser,
    } as unknown as UserRepositoryPort;
    const sessions = {
      create: createSession,
    } as unknown as RefreshSessionRepositoryPort;
    const passwords = {
      hash: hashPassword,
    } as unknown as PasswordHasherPort;
    const tokens = {
      generateAccessToken: jest.fn().mockReturnValue("access-token"),
      generateRefreshToken: jest.fn().mockReturnValue("refresh-token"),
      hashToken: jest.fn().mockReturnValue("refresh-token-hash"),
    } as unknown as TokenServicePort;

    const result = await new RegisterUseCase(
      users,
      sessions,
      passwords,
      tokens,
    ).execute({ email: " Learner@Example.com ", password: "safe-password" });

    expect(findByEmail).toHaveBeenCalledWith("learner@example.com");
    expect(createUser).toHaveBeenCalledWith({
      email: "learner@example.com",
      password: "hash",
    });
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        tokenHash: "refresh-token-hash",
      }),
    );
    expect(result).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: {
        id: user.id,
        email: user.email,
        role: UserRole.LEARNER,
        createdAt,
      },
    });
  });

  it("rejects a duplicate normalized email before hashing a password", async () => {
    const hashPassword = jest.fn();
    const users = {
      findByEmail: jest.fn().mockResolvedValue(user),
    } as unknown as UserRepositoryPort;
    const passwords = { hash: hashPassword } as unknown as PasswordHasherPort;
    const useCase = new RegisterUseCase(
      users,
      {} as RefreshSessionRepositoryPort,
      passwords,
      {} as TokenServicePort,
    );

    await expect(
      useCase.execute({
        email: "Learner@Example.com",
        password: "safe-password",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(hashPassword).not.toHaveBeenCalled();
  });
});
