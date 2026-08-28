import { IsIn, IsObject, IsUUID } from "class-validator";

export const ADMIN_RESOURCES = [
  "levels",
  "units",
  "lessons",
  "vocabulary",
  "grammar-points",
  "quizzes",
  "quiz-questions",
  "quiz-options",
] as const;

export type AdminResource = (typeof ADMIN_RESOURCES)[number];

export class AdminResourceParamsDto {
  @IsIn(ADMIN_RESOURCES)
  resource!: AdminResource;
}

export class AdminResourceIdParamsDto extends AdminResourceParamsDto {
  @IsUUID()
  id!: string;
}

export class AdminContentBodyDto {
  @IsObject()
  data!: Record<string, unknown>;
}
