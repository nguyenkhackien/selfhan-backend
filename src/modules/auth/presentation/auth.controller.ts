import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { RegisterUseCase } from "../application/register.use-case";
import { LoginUseCase } from "../application/login.use-case";
import { RefreshUseCase } from "../application/refresh.use-case";
import { LogoutUseCase } from "../application/logout.use-case";
import { GetMeUseCase } from "../application/get-me.use-case";
import { RegisterDto, LoginDto, AuthResponseDto } from "./auth.dto";
import { Public } from "./public.decorator";
import { RequestWithContext } from "../../../common/types/request-context.type";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function getRefreshToken(request: Request): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }

  const refreshCookie = cookieHeader
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("selfhan_refresh="));

  return refreshCookie?.slice("selfhan_refresh=".length);
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  @Post("register")
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.registerUseCase.execute(dto);

    res.cookie("selfhan_refresh", result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post("login")
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.loginUseCase.execute(dto);

    res.cookie("selfhan_refresh", result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post("refresh")
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: RequestWithContext,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken = getRefreshToken(req);

    const result = await this.refreshUseCase.execute({ refreshToken });

    res.cookie("selfhan_refresh", result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: RequestWithContext,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = getRefreshToken(req);

    await this.logoutUseCase.execute({ refreshToken });

    res.clearCookie("selfhan_refresh", REFRESH_COOKIE_OPTIONS);
  }

  @Get("me")
  async getMe(
    @Req() req: RequestWithContext,
  ): Promise<{ id: string; email: string; role: string; createdAt: Date }> {
    const user = req.user;
    if (!user) {
      throw new Error("AccessTokenGuard did not establish a principal");
    }
    const result = await this.getMeUseCase.execute({ userId: user.id });
    return result;
  }
}
