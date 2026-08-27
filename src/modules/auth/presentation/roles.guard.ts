import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../domain/user.entity";
import { ROLES_KEY } from "./roles.decorator";
import { RequestWithContext } from "../../../common/types/request-context.type";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Access denied.",
      });
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Insufficient permissions.",
      });
    }

    return true;
  }
}
