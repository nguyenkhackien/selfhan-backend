/* Controller methods return serialized service results. */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { Roles } from "../auth/presentation/roles.decorator";
import { UserRole } from "../auth/domain/user.entity";
import {
  AdminContentBodyDto,
  AdminResourceIdParamsDto,
  AdminResourceParamsDto,
} from "./admin-content.dto";
import { AdminContentService } from "./admin-content.service";

@Controller("admin")
@Roles(UserRole.ADMIN)
export class AdminContentController {
  constructor(private readonly content: AdminContentService) {}

  @Get(":resource")
  list(@Param() params: AdminResourceParamsDto) {
    return this.content.list(params.resource);
  }

  @Post(":resource")
  create(
    @Param() params: AdminResourceParamsDto,
    @Body() dto: AdminContentBodyDto,
  ) {
    return this.content.create(params.resource, dto.data);
  }

  @Patch(":resource/:id")
  update(
    @Param() params: AdminResourceIdParamsDto,
    @Body() dto: AdminContentBodyDto,
  ) {
    return this.content.update(params.resource, params.id, dto.data);
  }

  @Post(":resource/:id/archive")
  @HttpCode(HttpStatus.OK)
  archive(@Param() params: AdminResourceIdParamsDto) {
    return this.content.archive(params.resource, params.id);
  }
}
