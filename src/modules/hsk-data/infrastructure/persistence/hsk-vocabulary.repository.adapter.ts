import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository, SelectQueryBuilder } from "typeorm";
import type {
  HskBandSummary,
  HskVocabularyDetail,
  HskVocabularyImportStatus as DomainImportStatus,
  HskVocabularySummary,
} from "../../domain/hsk-vocabulary";
import {
  HskVocabularyRepositoryPort,
  type ListHskVocabularyQuery,
} from "../../application/hsk-vocabulary.ports";
import {
  HskVocabularyImportStatus,
  HskVocabularyOrmEntity,
} from "./hsk-vocabulary.orm-entity";

@Injectable()
export class HskVocabularyRepositoryAdapter implements HskVocabularyRepositoryPort {
  constructor(
    @InjectRepository(HskVocabularyOrmEntity)
    private readonly repository: Repository<HskVocabularyOrmEntity>,
  ) {}

  async listBands(): Promise<readonly HskBandSummary[]> {
    const rows = await this.repository
      .createQueryBuilder("vocabulary")
      .select("vocabulary.hskBand", "band")
      .addSelect("COUNT(*)", "count")
      .groupBy("vocabulary.hskBand")
      .orderBy("vocabulary.hskBand", "ASC")
      .getRawMany<{ band: string; count: string }>();

    return rows.map((row) => {
      const band = Number.parseInt(row.band, 10);
      return {
        band,
        displayBand: band === 7 ? "HSK 7–9" : "HSK " + band,
        count: Number.parseInt(row.count, 10),
      };
    });
  }

  async list(
    input: ListHskVocabularyQuery,
  ): Promise<readonly HskVocabularySummary[]> {
    const builder = this.repository
      .createQueryBuilder("vocabulary")
      .leftJoinAndSelect("vocabulary.senses", "sense")
      .orderBy("vocabulary.hskBand", "ASC")
      .addOrderBy("vocabulary.sourceOrder", "ASC")
      .addOrderBy("vocabulary.id", "ASC")
      .take(input.limit);

    if (input.band !== null) {
      builder.andWhere("vocabulary.hskBand = :band", { band: input.band });
    }
    if (input.query !== null) {
      const term = "%" + escapeLike(input.query) + "%";
      builder.andWhere(
        new Brackets((where) =>
          where
            .where("vocabulary.simplified ILIKE :term ESCAPE '\\'", { term })
            .orWhere("vocabulary.pinyin ILIKE :term ESCAPE '\\'", { term })
            .orWhere("vocabulary.sinoViet ILIKE :term ESCAPE '\\'", { term })
            .orWhere("sense.meaningVi ILIKE :term ESCAPE '\\'", { term }),
        ),
      );
    }
    if (input.cursor !== null) {
      applyCursor(builder, input);
    }

    const entities = await builder.getMany();
    return entities.map((entity) => this.toSummary(entity));
  }

  async findById(id: string): Promise<HskVocabularyDetail | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: { senses: true },
    });
    if (entity === null) {
      return null;
    }

    return {
      ...this.toSummary(entity),
      traditional: entity.traditional,
      frequency: entity.frequency,
      senses: entity.senses
        .slice()
        .sort((left, right) => left.sourceOrder - right.sourceOrder)
        .map((sense) => sense.meaningVi),
    };
  }

  private toSummary(entity: HskVocabularyOrmEntity): HskVocabularySummary {
    const firstSense = entity.senses
      .slice()
      .sort((left, right) => left.sourceOrder - right.sourceOrder)
      .at(0);

    return {
      id: entity.id,
      hskBand: entity.hskBand,
      sourceOrder: entity.sourceOrder,
      simplified: entity.simplified,
      pinyin: entity.pinyin,
      sinoViet: entity.sinoViet,
      primaryMeaning: firstSense?.meaningVi ?? null,
      importStatus: toDomainImportStatus(entity.importStatus),
    };
  }
}

function applyCursor(
  builder: SelectQueryBuilder<HskVocabularyOrmEntity>,
  input: ListHskVocabularyQuery,
): void {
  const cursor = input.cursor;
  if (cursor === null) {
    return;
  }

  if (input.band !== null) {
    builder.andWhere(
      "(vocabulary.sourceOrder > :sourceOrder OR (vocabulary.sourceOrder = :sourceOrder AND vocabulary.id > :id))",
      cursor,
    );
    return;
  }

  builder.andWhere(
    "(vocabulary.hskBand > :hskBand OR (vocabulary.hskBand = :hskBand AND vocabulary.sourceOrder > :sourceOrder) OR (vocabulary.hskBand = :hskBand AND vocabulary.sourceOrder = :sourceOrder AND vocabulary.id > :id))",
    cursor,
  );
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function toDomainImportStatus(
  value: HskVocabularyImportStatus,
): DomainImportStatus {
  return value === HskVocabularyImportStatus.READY ? "ready" : "needs_review";
}
