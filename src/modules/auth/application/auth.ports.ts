import {
  CreateUserInput,
  User,
  UserResponse,
  UserRole,
} from "../domain/user.entity";
import {
  CreateRefreshSessionInput,
  RefreshSession,
} from "../domain/refresh-session.entity";

export abstract class UserRepositoryPort {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(input: CreateUserInput): Promise<User>;
  abstract findById(id: string): Promise<User | null>;
}

export abstract class RefreshSessionRepositoryPort {
  abstract create(input: CreateRefreshSessionInput): Promise<RefreshSession>;
  abstract rotate(
    currentSessionId: string,
    input: CreateRefreshSessionInput,
  ): Promise<RefreshSession | null>;
  abstract findByTokenHash(tokenHash: string): Promise<RefreshSession | null>;
  abstract revoke(id: string): Promise<void>;
  abstract revokeAllForUser(userId: string): Promise<void>;
}

export abstract class PasswordHasherPort {
  abstract hash(password: string): Promise<string>;
  abstract verify(password: string, hash: string): Promise<boolean>;
}

export abstract class TokenServicePort {
  abstract generateAccessToken(user: UserResponse): string;
  abstract generateRefreshToken(): string;
  abstract verifyAccessToken(
    token: string,
  ): Promise<{ userId: string; role: UserRole }>;
  abstract hashToken(token: string): string;
}
