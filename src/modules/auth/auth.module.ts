import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./presentation/auth.controller";
import { AccessTokenGuard } from "./presentation/access-token.guard";
import { RolesGuard } from "./presentation/roles.guard";
import { RegisterUseCase } from "./application/register.use-case";
import { LoginUseCase } from "./application/login.use-case";
import { RefreshUseCase } from "./application/refresh.use-case";
import { LogoutUseCase } from "./application/logout.use-case";
import { GetMeUseCase } from "./application/get-me.use-case";
import { UserRepositoryAdapter } from "./infrastructure/persistence/user.repository.adapter";
import { RefreshSessionRepositoryAdapter } from "./infrastructure/persistence/refresh-session.repository.adapter";
import { Argon2PasswordHasherAdapter } from "./infrastructure/argon2-password-hasher.adapter";
import { JwtTokenServiceAdapter } from "./infrastructure/jwt-token.service.adapter";
import { UserOrmEntity } from "./infrastructure/persistence/user.orm-entity";
import { RefreshSessionOrmEntity } from "./infrastructure/persistence/refresh-session.orm-entity";
import {
  UserRepositoryPort,
  RefreshSessionRepositoryPort,
  PasswordHasherPort,
  TokenServicePort,
} from "./application/auth.ports";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, RefreshSessionOrmEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_ACCESS_SECRET"),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: UserRepositoryPort,
      useClass: UserRepositoryAdapter,
    },
    {
      provide: RefreshSessionRepositoryPort,
      useClass: RefreshSessionRepositoryAdapter,
    },
    {
      provide: PasswordHasherPort,
      useClass: Argon2PasswordHasherAdapter,
    },
    {
      provide: TokenServicePort,
      useClass: JwtTokenServiceAdapter,
    },
    RegisterUseCase,
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    GetMeUseCase,
    AccessTokenGuard,
    RolesGuard,
  ],
  exports: [AccessTokenGuard, RolesGuard, TokenServicePort, UserRepositoryPort],
})
export class AuthModule {}
