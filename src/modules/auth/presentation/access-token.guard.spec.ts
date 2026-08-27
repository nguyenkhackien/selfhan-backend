import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AccessTokenGuard } from "./access-token.guard";
import { TokenServicePort } from "../application/auth.ports";

describe("AccessTokenGuard", () => {
  let guard: AccessTokenGuard;
  let mockTokenService: jest.Mocked<TokenServicePort>;
  let mockReflector: jest.Mocked<Reflector>;
  let verifyAccessTokenMock: jest.Mock;

  beforeEach(() => {
    verifyAccessTokenMock = jest.fn();
    mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyAccessToken: verifyAccessTokenMock,
      hashToken: jest.fn(),
    };

    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new AccessTokenGuard(mockTokenService, mockReflector);
  });

  const createMockContext = (authHeader?: string): ExecutionContext => {
    const request = {
      headers: {
        authorization: authHeader,
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  describe("public routes", () => {
    it("should allow access to public routes", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const context = createMockContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(verifyAccessTokenMock).not.toHaveBeenCalled();
    });
  });

  describe("authenticated routes", () => {
    it("should reject request without authorization header", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const context = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should reject request with non-Bearer authorization", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const context = createMockContext("Basic abc123");

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should accept valid access token", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      verifyAccessTokenMock.mockResolvedValue({
        userId: "user-123",
        role: "learner",
      });

      const context = createMockContext("Bearer valid-token");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(verifyAccessTokenMock).toHaveBeenCalledWith("valid-token");
    });

    it("should reject invalid access token", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      verifyAccessTokenMock.mockRejectedValue(new Error("Invalid token"));

      const context = createMockContext("Bearer invalid-token");

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
