import { Controller, Get, Param } from "@nestjs/common";
import { Public } from "../../auth/presentation/public.decorator";
import { ListLevelsUseCase } from "../application/list-levels.use-case";
import { GetLevelBySlugUseCase } from "../application/get-level-by-slug.use-case";
import { GetUnitBySlugUseCase } from "../application/get-unit-by-slug.use-case";
import { GetLessonBySlugUseCase } from "../application/get-lesson-by-slug.use-case";
import {
  LessonDetailDto,
  LevelDetailDto,
  LevelListDto,
  SlugParamsDto,
  UnitDetailDto,
} from "./curriculum.dto";

@Controller()
@Public()
export class CurriculumController {
  constructor(
    private readonly listLevelsUseCase: ListLevelsUseCase,
    private readonly getLevelBySlugUseCase: GetLevelBySlugUseCase,
    private readonly getUnitBySlugUseCase: GetUnitBySlugUseCase,
    private readonly getLessonBySlugUseCase: GetLessonBySlugUseCase,
  ) {}

  @Get("levels")
  async listLevels(): Promise<LevelListDto> {
    const { levels } = await this.listLevelsUseCase.execute();
    return {
      items: levels.map((level) => ({
        id: level.id,
        slug: level.slug,
        title: level.title,
        description: level.description,
        sortOrder: level.sortOrder,
      })),
    };
  }

  @Get("levels/:slug")
  async getLevelBySlug(
    @Param() params: SlugParamsDto,
  ): Promise<LevelDetailDto> {
    const { level, units } = await this.getLevelBySlugUseCase.execute(
      params.slug,
    );
    return {
      id: level.id,
      slug: level.slug,
      title: level.title,
      description: level.description,
      sortOrder: level.sortOrder,
      units: units.map((unit) => ({
        id: unit.id,
        slug: unit.slug,
        title: unit.title,
        description: unit.description,
        sortOrder: unit.sortOrder,
      })),
    };
  }

  @Get("units/:slug")
  async getUnitBySlug(@Param() params: SlugParamsDto): Promise<UnitDetailDto> {
    const { unit, lessons } = await this.getUnitBySlugUseCase.execute(
      params.slug,
    );
    return {
      id: unit.id,
      slug: unit.slug,
      title: unit.title,
      description: unit.description,
      sortOrder: unit.sortOrder,
      lessons: lessons.map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        writingCharacter: lesson.writingCharacter,
        sortOrder: lesson.sortOrder,
      })),
    };
  }

  @Get("lessons/:slug")
  async getLessonBySlug(
    @Param() params: SlugParamsDto,
  ): Promise<LessonDetailDto> {
    const { lesson, vocabulary, grammarPoints } =
      await this.getLessonBySlugUseCase.execute(params.slug);
    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
      writingCharacter: lesson.writingCharacter,
      sortOrder: lesson.sortOrder,
      vocabulary: vocabulary.map((item) => ({
        id: item.id,
        hanzi: item.hanzi,
        pinyin: item.pinyin,
        meaningVi: item.meaningVi,
        audioUrl: item.audioUrl,
        examples: item.exampleSentences.map((example) => ({
          hanzi: example.hanzi,
          pinyin: example.pinyin,
          meaningVi: example.meaningVi,
          audioUrl: example.audioUrl,
          sortOrder: example.sortOrder,
        })),
      })),
      grammarPoints: grammarPoints.map((grammarPoint) => ({
        id: grammarPoint.id,
        title: grammarPoint.title,
        explanationVi: grammarPoint.explanationVi,
        examples: grammarPoint.examplesJson,
        sortOrder: grammarPoint.sortOrder,
      })),
    };
  }
}
