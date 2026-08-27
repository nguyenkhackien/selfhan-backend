import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from "class-validator";

const BAND_VALUES = ["1", "2", "3", "4", "5", "6", "7"];
const LIMIT_PATTERN = /^(?:[1-9]|[1-4][0-9]|50)$/;
const CURSOR_PATTERN = /^[A-Za-z0-9_-]+$/;

export class HskVocabularyQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(BAND_VALUES)
  band?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  query?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  @Matches(CURSOR_PATTERN)
  cursor?: string;

  @IsOptional()
  @IsString()
  @Matches(LIMIT_PATTERN)
  limit?: string;
}

export class HskVocabularyParamsDto {
  @IsUUID()
  id!: string;
}

export interface HskBandSummaryDto {
  band: number;
  displayBand: string;
  count: number;
}

export interface HskVocabularySummaryDto {
  id: string;
  hskBand: number;
  sourceOrder: number;
  simplified: string;
  pinyin: string;
  sinoViet: string | null;
  primaryMeaning: string | null;
  importStatus: "ready" | "needs_review";
}

export interface HskVocabularyPageDto {
  items: HskVocabularySummaryDto[];
  nextCursor: string | null;
}

export interface HskVocabularyDetailDto extends HskVocabularySummaryDto {
  traditional: string | null;
  frequency: number | null;
  senses: string[];
}
