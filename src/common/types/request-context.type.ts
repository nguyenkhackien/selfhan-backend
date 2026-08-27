import { Request } from "express";
import { UserRole } from "../../modules/auth/domain/user.entity";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export interface RefreshCookies {
  selfhan_refresh?: string;
}

export type RequestWithContext = Request & {
  requestId?: string;
  user?: AuthenticatedUser;
  cookies?: RefreshCookies;
};
