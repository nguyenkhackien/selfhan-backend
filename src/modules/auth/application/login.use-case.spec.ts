import { UnauthorizedException } from "@nestjs/common";
import {
  PasswordHasherPort,
  RefreshSessionRepositoryPort,
  TokenServicePort,
  UserRepositoryPort,
} from "./auth.ports";
import { LoginUseCase } from "./login.use-case";

describe("LoginUseCase", () => {
  it("returns the same safe failure for an unknown email", async () => {
    const users = {
      findByEmail: jest.fn().mockResolvedValue(null),
    } as unknown as UserRepositoryPort;
    const verifyPassword = jest.fn();
    const passwords = {
      verify: verifyPassword,
    } as unknown as PasswordHasherPort;
    const useCase = new LoginUseCase(
      users,
      {} as RefreshSessionRepositoryPort,
      passwords,
      {} as TokenServicePort,
    );

    await expect(
      useCase.execute({
        email: "missing@example.com",
        password: "safe-password",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyPassword).not.toHaveBeenCalled();
  });
});
