import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  HskVocabularyCursor,
  HskVocabularySummary,
} from "../domain/hsk-vocabulary";
import {
  HskVocabularyRepositoryPort,
  type ListHskVocabularyQuery,
} from "./hsk-vocabulary.ports";

export interface ListHskVocabularyInput {
  readonly band: number | null;
  readonly query?: string | null;
  readonly cursor?: string | null;
  readonly limit: number;
}

export interface ListHskVocabularyOutput {
  readonly items: readonly HskVocabularySummary[];
  readonly nextCursor: string | null;
}

@Injectable()
export class ListHskVocabularyUseCase {
  constructor(private readonly repository: HskVocabularyRepositoryPort) {}

  async execute(
    input: ListHskVocabularyInput,
  ): Promise<ListHskVocabularyOutput> {
    const cursor =
      input.cursor === null || input.cursor === undefined
        ? null
        : decodeCursor(input.cursor);
    const query: ListHskVocabularyQuery = {
      band: input.band,
      cursor,
      limit: input.limit + 1,
      query: input.query?.trim() || null,
    };
    const rows = await this.repository.list(query);
    const items = rows.slice(0, input.limit);
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor:
        rows.length > input.limit && lastItem !== undefined
          ? encodeCursor(lastItem)
          : null,
    };
  }
}

function encodeCursor(item: HskVocabularySummary): string {
  return Buffer.from(
    JSON.stringify({
      hskBand: item.hskBand,
      sourceOrder: item.sourceOrder,
      id: item.id,
    }),
  ).toString("base64url");
}

function decodeCursor(value: string): HskVocabularyCursor {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    );
    if (
      !isRecord(parsed) ||
      !isPositiveInteger(parsed.hskBand) ||
      !isPositiveInteger(parsed.sourceOrder) ||
      typeof parsed.id !== "string" ||
      parsed.id.length === 0
    ) {
      throw new Error("Invalid HSK vocabulary cursor.");
    }

    return {
      hskBand: parsed.hskBand,
      sourceOrder: parsed.sourceOrder,
      id: parsed.id,
    };
  } catch {
    throw new BadRequestException("Invalid HSK vocabulary cursor.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
