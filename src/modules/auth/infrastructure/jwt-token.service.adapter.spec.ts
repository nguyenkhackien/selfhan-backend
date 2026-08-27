import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { JwtTokenServiceAdapter } from "./jwt-token.service.adapter";
import { UserRole } from "../domain/user.entity";

describe("JwtTokenServiceAdapter", () => {
  let adapter: JwtTokenServiceAdapter;
  let jwtService: JwtService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        JWT_ACCESS_SECRET: "test-access-secret-key-at-least-32-characters",
        JWT_ACCESS_EXPIRATION: "15m",
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: "test-access-secret-key-at-least-32-characters",
        }),
      ],
      providers: [
        JwtTokenServiceAdapter,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    adapter = module.get(JwtTokenServiceAdapter);
    jwtService = module.get(JwtService);
  });

  describe("generateAccessToken", () => {
    it("should generate a valid access token", () => {
      const user = {
        id: "user-123",
        email: "test@example.com",
        role: UserRole.LEARNER,
        createdAt: new Date(),
      };

      const token = adapter.generateAccessToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("should include the minimal access-token claims", () => {
      const user = {
        id: "user-123",
        email: "test@example.com",
        role: UserRole.LEARNER,
        createdAt: new Date(),
      };

      const token = adapter.generateAccessToken(user);
      const decoded = jwtService.decode<{
        sub: string;
        role: string;
        tokenType: string;
      }>(token);

      expect(decoded.sub).toBe("user-123");
      expect(decoded.role).toBe(UserRole.LEARNER);
      expect(decoded.tokenType).toBe("access");
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate distinct opaque refresh tokens", () => {
      const token = adapter.generateRefreshToken();
      const anotherToken = adapter.generateRefreshToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token).toHaveLength(64);
      expect(token).not.toContain(".");
      expect(token).not.toBe(anotherToken);
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify a valid access token", async () => {
      const user = {
        id: "user-123",
        email: "test@example.com",
        role: UserRole.LEARNER,
        createdAt: new Date(),
      };

      const token = adapter.generateAccessToken(user);
      const result = await adapter.verifyAccessToken(token);

      expect(result.userId).toBe("user-123");
      expect(result.role).toBe(UserRole.LEARNER);
    });

    it("should reject an invalid token", async () => {
      await expect(
        adapter.verifyAccessToken("invalid-token"),
      ).rejects.toThrow();
    });

    it("should reject a token signed with wrong secret", async () => {
      const wrongJwtService = new JwtService({
        secret: "wrong-secret-key-at-least-32-characters-long",
      });
      const token = wrongJwtService.sign({ sub: "user-123", role: "learner" });

      await expect(adapter.verifyAccessToken(token)).rejects.toThrow();
    });

    it("should reject a token without the access-token type", async () => {
      const token = jwtService.sign({
        sub: "user-123",
        role: UserRole.LEARNER,
      });

      await expect(adapter.verifyAccessToken(token)).rejects.toThrow();
    });
  });

  describe("hashToken", () => {
    it("should hash a token with SHA-256", () => {
      const token = "test-refresh-token";
      const hash = adapter.hashToken(token);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash).toHaveLength(64);
    });

    it("should produce consistent hashes for the same input", () => {
      const token = "test-refresh-token";
      const hash1 = adapter.hashToken(token);
      const hash2 = adapter.hashToken(token);

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", () => {
      const hash1 = adapter.hashToken("token-1");
      const hash2 = adapter.hashToken("token-2");

      expect(hash1).not.toBe(hash2);
    });
  });
});
