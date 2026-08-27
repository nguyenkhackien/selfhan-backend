import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { TokenServicePort } from "../application/auth.ports";
import { RequestWithContext } from "../../../common/types/request-context.type";
import { IS_PUBLIC_KEY } from "./public.decorator";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenServicePort,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        code: "INVALID_ACCESS_TOKEN",
        message: "Missing or invalid access token.",
      });
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      request.user = {
        id: payload.userId,
        role: payload.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_ACCESS_TOKEN",
        message: "Invalid or expired access token.",
      });
    }
  }
}
