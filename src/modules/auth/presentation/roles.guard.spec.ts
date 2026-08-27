import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import { UserRole } from "../domain/user.entity";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let mockReflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(mockReflector);
  });

  const createMockContext = (user?: {
    id: string;
    role: string;
  }): ExecutionContext => {
    const request = { user };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  describe("no required roles", () => {
    it("should allow access when no roles are required", () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const context = createMockContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should allow access when empty roles array", () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);

      const context = createMockContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe("role-based access", () => {
    it("should allow access when user has required role", () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.LEARNER]);

      const context = createMockContext({
        id: "user-123",
        role: UserRole.LEARNER,
      });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should reject access when user lacks required role", () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({
        id: "user-123",
        role: UserRole.LEARNER,
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("should reject access when user is not authenticated", () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext();

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
