import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes } from "crypto";
import type { StringValue } from "ms";
import { TokenServicePort } from "../application/auth.ports";
import { UserResponse, UserRole } from "../domain/user.entity";

interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  tokenType: "access";
}

@Injectable()
export class JwtTokenServiceAdapter implements TokenServicePort {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(user: UserResponse): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      role: user.role,
      tokenType: "access",
    };
    const expiresIn = this.configService.get<StringValue>(
      "JWT_ACCESS_EXPIRATION",
      "15m" as StringValue,
    );
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
      expiresIn,
    });
  }

  generateRefreshToken(): string {
    return randomBytes(48).toString("base64url");
  }

  async verifyAccessToken(
    token: string,
  ): Promise<{ userId: string; role: UserRole }> {
    const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
      token,
      {
        secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
      },
    );
    if (
      typeof payload.sub !== "string" ||
      payload.tokenType !== "access" ||
      !Object.values(UserRole).includes(payload.role)
    ) {
      throw new Error("Invalid access token claims");
    }

    return { userId: payload.sub, role: payload.role };
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
