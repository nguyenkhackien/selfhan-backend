/* TypeORM exposes raw SQL rows as `any`; this module owns their validation boundary. */
/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import type { AdminResource } from "./admin-content.dto";

type ResourceConfig = {
  table: string;
  fields: readonly string[];
  required: readonly string[];
  order: string;
  updatedAt?: boolean;
};

const RESOURCES: Record<AdminResource, ResourceConfig> = {
  levels: {
    table: "levels",
    fields: ["slug", "title", "description", "sortOrder", "status"],
    required: ["slug", "title", "sortOrder"],
    order: '"sortOrder" ASC',
    updatedAt: true,
  },
  units: {
    table: "units",
    fields: ["levelId", "slug", "title", "description", "sortOrder", "status"],
    required: ["levelId", "slug", "title", "sortOrder"],
    order: '"sortOrder" ASC',
    updatedAt: true,
  },
  lessons: {
    table: "lessons",
    fields: [
      "unitId",
      "slug",
      "title",
      "summary",
      "writingCharacter",
      "sortOrder",
      "status",
    ],
    required: ["unitId", "slug", "title", "sortOrder"],
    order: '"sortOrder" ASC',
    updatedAt: true,
  },
  vocabulary: {
    table: "vocabulary",
    fields: ["hanzi", "pinyin", "meaningVi", "audioUrl", "status"],
    required: ["hanzi", "pinyin", "meaningVi"],
    order: '"createdAt" DESC',
    updatedAt: true,
  },
  "grammar-points": {
    table: "grammar_points",
    fields: ["lessonId", "title", "explanationVi", "examplesJson", "sortOrder"],
    required: ["lessonId", "title", "explanationVi", "sortOrder"],
    order: '"sortOrder" ASC',
    updatedAt: true,
  },
  quizzes: {
    table: "quizzes",
    fields: ["lessonId", "unitId", "title", "kind", "passingScore", "status"],
    required: ["title", "kind"],
    order: '"createdAt" DESC',
    updatedAt: true,
  },
  "quiz-questions": {
    table: "quiz_questions",
    fields: ["quizId", "type", "prompt", "audioUrl", "sortOrder"],
    required: ["quizId", "type", "prompt", "sortOrder"],
    order: '"sortOrder" ASC',
    updatedAt: true,
  },
  "quiz-options": {
    table: "quiz_options",
    fields: ["questionId", "label", "isCorrect", "sortOrder"],
    required: ["questionId", "label", "isCorrect", "sortOrder"],
    order: '"sortOrder" ASC',
  },
};

@Injectable()
export class AdminContentService {
  constructor(private readonly dataSource: DataSource) {}

  async list(resource: AdminResource) {
    const config = RESOURCES[resource];
    return this.dataSource.query(
      `SELECT * FROM "${config.table}" ORDER BY ${config.order} LIMIT 200`,
    );
  }

  async create(resource: AdminResource, data: Record<string, unknown>) {
    const config = RESOURCES[resource];
    const entries = this.entries(config.fields, data);
    this.requireFields(config.required, data);
    await this.validate(resource, data, "create");
    const columns = entries.map(([field]) => `"${field}"`).join(", ");
    const placeholders = entries.map((_, index) => `$${index + 1}`).join(", ");
    const [created] = await this.dataSource.query(
      `INSERT INTO "${config.table}" (${columns}) VALUES (${placeholders}) RETURNING *`,
      entries.map(([, value]) => value),
    );
    return created;
  }

  async update(
    resource: AdminResource,
    id: string,
    data: Record<string, unknown>,
  ) {
    const config = RESOURCES[resource];
    const entries = this.entries(config.fields, data);
    await this.validate(resource, data, "update", id);
    const assignments = entries
      .map(([field], index) => `"${field}" = $${index + 1}`)
      .join(", ");
    const updatedAt = config.updatedAt ? ', "updatedAt" = now()' : "";
    const [updated] = await this.dataSource.query(
      `UPDATE "${config.table}" SET ${assignments}${updatedAt} WHERE "id" = $${entries.length + 1} RETURNING *`,
      [...entries.map(([, value]) => value), id],
    );
    if (!updated) throw new NotFoundException("Content record was not found.");
    return updated;
  }

  async archive(resource: AdminResource, id: string) {
    const config = RESOURCES[resource];
    if (!config.fields.includes("status"))
      throw new BadRequestException("This content type cannot be archived.");
    const [updated] = await this.dataSource.query(
      `UPDATE "${config.table}" SET "status" = 'archived', "updatedAt" = now() WHERE "id" = $1 RETURNING *`,
      [id],
    );
    if (!updated) throw new NotFoundException("Content record was not found.");
    return updated;
  }

  private entries(fields: readonly string[], data: Record<string, unknown>) {
    const entries = Object.entries(data).filter(([field]) =>
      fields.includes(field),
    );
    if (entries.length === 0 || entries.length !== Object.keys(data).length) {
      throw new BadRequestException(
        "Request contains no mutable content fields.",
      );
    }
    return entries;
  }

  private requireFields(
    required: readonly string[],
    data: Record<string, unknown>,
  ) {
    const missing = required.filter(
      (field) =>
        data[field] === undefined || data[field] === null || data[field] === "",
    );
    if (missing.length)
      throw new BadRequestException(
        `Missing required fields: ${missing.join(", ")}.`,
      );
  }

  private async validate(
    resource: AdminResource,
    data: Record<string, unknown>,
    action: "create" | "update",
    id?: string,
  ) {
    for (const field of ["sortOrder", "passingScore"]) {
      if (
        field in data &&
        (!Number.isInteger(data[field]) ||
          (field === "passingScore" &&
            ((data[field] as number) < 0 || (data[field] as number) > 100)))
      ) {
        throw new BadRequestException(`${field} must be a valid integer.`);
      }
    }
    if (
      "status" in data &&
      !["draft", "published", "archived"].includes(String(data.status))
    ) {
      throw new BadRequestException("Unknown content status.");
    }
    if (resource === "quizzes") {
      const existing = id ? await this.findRecord("quizzes", id) : {};
      const merged = { ...existing, ...data };
      if (merged.kind !== "lesson" && merged.kind !== "unit")
        throw new BadRequestException("Quiz kind must be lesson or unit.");
      const validTarget =
        (merged.kind === "lesson" &&
          Boolean(merged.lessonId) &&
          !merged.unitId) ||
        (merged.kind === "unit" && Boolean(merged.unitId) && !merged.lessonId);
      if (!validTarget)
        throw new BadRequestException(
          "A quiz must have exactly one target matching its kind.",
        );
      if (merged.status === "published") {
        if (action === "create")
          throw new BadRequestException(
            "Create a quiz as draft, add its questions, then publish it.",
          );
        await this.assertQuizCanPublish(id!);
      }
    }
    if (
      resource === "quiz-questions" &&
      "type" in data &&
      !["hanzi_to_meaning", "meaning_to_hanzi", "pinyin", "listening"].includes(
        String(data.type),
      )
    ) {
      throw new BadRequestException("Unknown quiz question type.");
    }
  }

  private async findRecord(
    table: string,
    id: string,
  ): Promise<Record<string, unknown>> {
    const [record] = await this.dataSource.query(
      `SELECT * FROM "${table}" WHERE "id" = $1`,
      [id],
    );
    if (!record) throw new NotFoundException("Content record was not found.");
    return record as Record<string, unknown>;
  }

  private async assertQuizCanPublish(quizId: string): Promise<void> {
    const questions = await this.dataSource.query(
      `SELECT q."id", COUNT(o."id")::int AS "optionCount", COUNT(*) FILTER (WHERE o."isCorrect")::int AS "correctCount" FROM "quiz_questions" q LEFT JOIN "quiz_options" o ON o."questionId" = q."id" WHERE q."quizId" = $1 GROUP BY q."id"`,
      [quizId],
    );
    if (
      !questions.length ||
      questions.some(
        (question: { optionCount: number; correctCount: number }) =>
          question.optionCount < 2 || question.correctCount !== 1,
      )
    ) {
      throw new BadRequestException(
        "A published quiz needs each question to have at least two options and exactly one correct answer.",
      );
    }
  }
}
