/* Controller methods return serialized service results. */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { RequestWithContext } from "../../common/types/request-context.type";
import {
  CreateReviewDto,
  DueReviewQueryDto,
  IdParamsDto,
  SubmitQuizAttemptDto,
  TagParamsDto,
  UpdateLessonProgressDto,
} from "./learning-state.dto";
import { LearningStateService } from "./learning-state.service";

@Controller()
export class LearningStateController {
  constructor(private readonly learning: LearningStateService) {}

  @Get("lessons/:id/quizzes")
  listLessonQuizzes(@Param() params: IdParamsDto) {
    return this.learning.listQuizzes("lesson", params.id);
  }

  @Get("units/:id/quizzes")
  listUnitQuizzes(@Param() params: IdParamsDto) {
    return this.learning.listQuizzes("unit", params.id);
  }

  @Get("quizzes/:id")
  getQuiz(@Param() params: IdParamsDto) {
    return this.learning.getQuiz(params.id);
  }

  @Post("quizzes/:id/attempts")
  submitAttempt(
    @Req() req: RequestWithContext,
    @Param() params: IdParamsDto,
    @Body() dto: SubmitQuizAttemptDto,
  ) {
    return this.learning.submitAttempt(
      this.userId(req),
      params.id,
      dto.answers,
    );
  }

  @Post("lessons/:id/progress")
  updateProgress(
    @Req() req: RequestWithContext,
    @Param() params: IdParamsDto,
    @Body() dto: UpdateLessonProgressDto,
  ) {
    return this.learning.updateProgress(
      this.userId(req),
      params.id,
      dto.sectionsSeen,
    );
  }

  @Get("lessons/:id/progress")
  getProgress(@Req() req: RequestWithContext, @Param() params: IdParamsDto) {
    return this.learning.getLessonProgress(this.userId(req), params.id);
  }

  @Get("dashboard")
  dashboard(@Req() req: RequestWithContext) {
    return this.learning.dashboard(this.userId(req));
  }

  @Get("reviews/due")
  dueReviews(
    @Req() req: RequestWithContext,
    @Query() query: DueReviewQueryDto,
  ) {
    return this.learning.dueReviews(
      this.userId(req),
      query.limit,
      query.cursor,
    );
  }

  @Post("reviews")
  review(@Req() req: RequestWithContext, @Body() dto: CreateReviewDto) {
    return this.learning.review(this.userId(req), dto.vocabularyId, dto.rating);
  }

  @Put("vocabulary/:vocabularyId/tags/:tag")
  @HttpCode(HttpStatus.NO_CONTENT)
  async tag(
    @Req() req: RequestWithContext,
    @Param() params: TagParamsDto,
  ): Promise<void> {
    await this.learning.tag(this.userId(req), params.vocabularyId, params.tag);
  }

  @Delete("vocabulary/:vocabularyId/tags/:tag")
  @HttpCode(HttpStatus.NO_CONTENT)
  async untag(
    @Req() req: RequestWithContext,
    @Param() params: TagParamsDto,
  ): Promise<void> {
    await this.learning.untag(
      this.userId(req),
      params.vocabularyId,
      params.tag,
    );
  }

  @Get("statistics")
  statistics(@Req() req: RequestWithContext) {
    return this.learning.statistics(this.userId(req));
  }

  private userId(req: RequestWithContext): string {
    if (!req.user)
      throw new UnauthorizedException("Authentication is required.");
    return req.user.id;
  }
}
