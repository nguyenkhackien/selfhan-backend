import { IsString, Matches } from "class-validator";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class SlugParamsDto {
  @IsString()
  @Matches(SLUG_PATTERN)
  slug!: string;
}

export interface LevelSummaryDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface LessonSummaryDto {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  writingCharacter: string | null;
  sortOrder: number;
}

export interface UnitSummaryDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface ExampleSentenceDto {
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  audioUrl: string | null;
  sortOrder: number;
}

export interface VocabularyDto {
  id: string;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  audioUrl: string | null;
  examples: ExampleSentenceDto[];
}

export interface GrammarPointDto {
  id: string;
  title: string;
  explanationVi: string;
  examples: string[];
  sortOrder: number;
}

export interface LevelDetailDto extends LevelSummaryDto {
  units: UnitSummaryDto[];
}

export interface UnitDetailDto extends UnitSummaryDto {
  lessons: LessonSummaryDto[];
}

export interface LessonDetailDto extends LessonSummaryDto {
  vocabulary: VocabularyDto[];
  grammarPoints: GrammarPointDto[];
}

export interface LevelListDto {
  items: LevelSummaryDto[];
}
