import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class IdParamsDto {
  @IsUUID()
  id!: string;
}

export class SubmitQuizAttemptDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}

export class QuizAnswerDto {
  @IsUUID()
  questionId!: string;

  @IsUUID()
  selectedOptionId!: string;
}

export class UpdateLessonProgressDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  sectionsSeen!: string[];
}

export class CreateReviewDto {
  @IsUUID()
  vocabularyId!: string;

  @IsIn(["again", "hard", "good", "easy"])
  rating!: "again" | "hard" | "good" | "easy";
}

export class TagParamsDto {
  @IsUUID()
  vocabularyId!: string;

  @IsIn(["favorite", "difficult"])
  tag!: "favorite" | "difficult";
}

export class DueReviewQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}
