import "reflect-metadata";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { DataSource, EntityManager } from "typeorm";
import dataSource from "./typeorm.data-source";
import {
  HskCharacterReadingOrmEntity,
  HskCharacterReadingSource,
} from "../../modules/hsk-data/infrastructure/persistence/hsk-character-reading.orm-entity";
import {
  HskVocabularyImportStatus,
  HskVocabularyOrmEntity,
} from "../../modules/hsk-data/infrastructure/persistence/hsk-vocabulary.orm-entity";
import { HskVocabularySenseOrmEntity } from "../../modules/hsk-data/infrastructure/persistence/hsk-vocabulary-sense.orm-entity";

const BATCH_SIZE = 250;
const datasetPath = join(process.cwd(), "data/hsk/hsk-3.0-vi.json");

const datasetSchema = z.object({
  schemaVersion: z.literal(1),
  entries: z.array(
    z.object({
      hskBand: z.number().int().min(1).max(7),
      sourceOrder: z.number().int().positive(),
      simplified: z.string().min(1).max(100),
      traditional: z.string().min(1).max(100).nullable(),
      pinyin: z.string().min(1).max(255),
      frequency: z.number().int().nullable(),
      sinoViet: z.string().min(1).max(255).nullable(),
      importStatus: z.enum(["ready", "needs_review"]),
      senses: z.array(z.string().min(1)),
      sourceRevisions: z.object({
        hsk: z.string().min(1).max(64),
      }),
    }),
  ),
  characterReadings: z.array(
    z.object({
      hanzi: z.string().min(1).max(1),
      sinoViet: z.string().min(1).max(100),
      source: z.enum(["kai_hanzi", "unihan"]),
      sourceRevision: z.string().min(1).max(64),
    }),
  ),
});

type HskDatasetFile = z.infer<typeof datasetSchema>;

export async function importHskDataset(
  source: DataSource,
  dataset: HskDatasetFile,
): Promise<void> {
  for (const readings of chunk(dataset.characterReadings, BATCH_SIZE)) {
    await source.transaction(async (manager) => {
      await manager.getRepository(HskCharacterReadingOrmEntity).upsert(
        readings.map((reading) => ({
          ...reading,
          source: toCharacterReadingSource(reading.source),
        })),
        ["hanzi"],
      );
    });
  }

  for (const entries of chunk(dataset.entries, BATCH_SIZE)) {
    await source.transaction((manager) =>
      importVocabularyBatch(manager, entries),
    );
  }
}

async function importVocabularyBatch(
  manager: EntityManager,
  entries: readonly HskDatasetFile["entries"][number][],
): Promise<void> {
  const vocabulary = manager.getRepository(HskVocabularyOrmEntity);
  const senses = manager.getRepository(HskVocabularySenseOrmEntity);

  for (const entry of entries) {
    await vocabulary.upsert(
      {
        hskBand: entry.hskBand,
        sourceOrder: entry.sourceOrder,
        simplified: entry.simplified,
        traditional: entry.traditional,
        pinyin: entry.pinyin,
        frequency: entry.frequency,
        sinoViet: entry.sinoViet,
        importStatus: toImportStatus(entry.importStatus),
        sourceRevision: entry.sourceRevisions.hsk,
      },
      ["hskBand", "simplified"],
    );

    const imported = await vocabulary.findOneByOrFail({
      hskBand: entry.hskBand,
      simplified: entry.simplified,
    });
    await senses.delete({ hskVocabularyId: imported.id });
    if (entry.senses.length > 0) {
      await senses.insert(
        entry.senses.map((meaningVi, index) => ({
          hskVocabularyId: imported.id,
          sourceOrder: index + 1,
          meaningVi,
        })),
      );
    }
  }
}

async function runImport(source: DataSource): Promise<void> {
  const dataset = datasetSchema.parse(
    JSON.parse(await readFile(datasetPath, "utf8")),
  );
  await source.initialize();
  await importHskDataset(source, dataset);
  await source.destroy();
  process.stdout.write(
    `Imported ${dataset.entries.length} HSK vocabulary entries and ${dataset.characterReadings.length} character readings.\n`,
  );
}

function toImportStatus(
  value: "ready" | "needs_review",
): HskVocabularyImportStatus {
  return value === "ready"
    ? HskVocabularyImportStatus.READY
    : HskVocabularyImportStatus.NEEDS_REVIEW;
}

function toCharacterReadingSource(
  value: "kai_hanzi" | "unihan",
): HskCharacterReadingSource {
  return value === "kai_hanzi"
    ? HskCharacterReadingSource.KAI_HANZI
    : HskCharacterReadingSource.UNIHAN;
}

function* chunk<T>(items: readonly T[], size: number): Generator<readonly T[]> {
  for (let index = 0; index < items.length; index += size) {
    yield items.slice(index, index + size);
  }
}

if (require.main === module) {
  void runImport(dataSource).catch((error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown HSK data import failure.";
    process.stderr.write(`HSK data import failed: ${message}\n`);
    process.exitCode = 1;
  });
}
