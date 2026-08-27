import { Controller, Get, Param, Query } from "@nestjs/common";
import { Public } from "../../auth/presentation/public.decorator";
import { GetHskVocabularyUseCase } from "../application/get-hsk-vocabulary.use-case";
import { ListHskBandsUseCase } from "../application/list-hsk-bands.use-case";
import { ListHskVocabularyUseCase } from "../application/list-hsk-vocabulary.use-case";
import {
  HskVocabularyParamsDto,
  HskVocabularyQueryDto,
  type HskBandSummaryDto,
  type HskVocabularyDetailDto,
  type HskVocabularyPageDto,
} from "./hsk-vocabulary.dto";

@Controller("hsk")
@Public()
export class HskVocabularyController {
  constructor(
    private readonly listBandsUseCase: ListHskBandsUseCase,
    private readonly listVocabularyUseCase: ListHskVocabularyUseCase,
    private readonly getVocabularyUseCase: GetHskVocabularyUseCase,
  ) {}

  @Get("bands")
  async listBands(): Promise<{ items: HskBandSummaryDto[] }> {
    const items = await this.listBandsUseCase.execute();
    return { items: [...items] };
  }

  @Get("vocabulary")
  async listVocabulary(
    @Query() query: HskVocabularyQueryDto,
  ): Promise<HskVocabularyPageDto> {
    const result = await this.listVocabularyUseCase.execute({
      band: query.band === undefined ? null : Number.parseInt(query.band, 10),
      cursor: query.cursor,
      limit: query.limit === undefined ? 24 : Number.parseInt(query.limit, 10),
      query: query.query,
    });
    return {
      items: [...result.items],
      nextCursor: result.nextCursor,
    };
  }

  @Get("vocabulary/:id")
  async getVocabulary(
    @Param() params: HskVocabularyParamsDto,
  ): Promise<HskVocabularyDetailDto> {
    const vocabulary = await this.getVocabularyUseCase.execute(params.id);
    return {
      ...vocabulary,
      senses: [...vocabulary.senses],
    };
  }
}
