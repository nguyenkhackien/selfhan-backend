import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  buildHskDataset,
  type HskDataset,
  type HskSourceRevisions,
} from "../src/modules/hsk-data/application/hsk-dataset-builder";

interface SourceLock {
  readonly sources: {
    readonly hsk: LockedRepositorySource;
    readonly cvdict: LockedRepositorySource;
    readonly kaiHanzi: LockedRepositorySource;
    readonly unihan: LockedUnihanSource;
  };
}

interface LockedRepositorySource extends LockedFileSource {
  readonly revision: string;
}

interface LockedFileSource {
  readonly files: Readonly<Record<string, string>>;
}

interface LockedUnihanSource extends LockedFileSource {
  readonly version: string;
}

const backendRoot = resolve(__dirname, "..");
const dataDirectory = join(backendRoot, "data/hsk");
const sourceDirectory =
  process.env.HSK_SOURCE_DIR ?? join(dataDirectory, ".source-cache");

async function main(): Promise<void> {
  const sourceLock = await readSourceLock(
    join(dataDirectory, "sources.lock.json"),
  );
  const sourceRevisions: HskSourceRevisions = {
    hsk: sourceLock.sources.hsk.revision,
    cvdict: sourceLock.sources.cvdict.revision,
    kaiHanzi: sourceLock.sources.kaiHanzi.revision,
    unihan: sourceLock.sources.unihan.version,
  };

  const hskEntries = await Promise.all(
    Array.from({ length: 7 }, async (_, index) => {
      const band = index + 1;
      const fileName = `new-${band}.json`;
      const contents = await readAndVerify(
        join(sourceDirectory, "hsk", fileName),
        sourceLock.sources.hsk.files[fileName],
      );
      return [band, contents] as const;
    }),
  );
  const cvdict = await readAndVerify(
    join(sourceDirectory, "cvdict", "CVDICT.u8"),
    sourceLock.sources.cvdict.files["CVDICT.u8"],
  );
  const kaiHanzi = await readAndVerify(
    join(sourceDirectory, "hanzi", "characters.json"),
    sourceLock.sources.kaiHanzi.files["characters.json"],
  );
  const unihanReadings = await readAndVerify(
    join(sourceDirectory, "unihan", "Unihan_Readings.txt"),
    sourceLock.sources.unihan.files["Unihan_Readings.txt"],
  );

  const dataset = buildHskDataset({
    hskByBand: new Map(hskEntries),
    cvdict,
    kaiHanzi,
    unihanReadings,
    sourceRevisions,
  });

  await writeJson(join(dataDirectory, "hsk-3.0-vi.json"), dataset);
  await writeJson(
    join(dataDirectory, "review-report.json"),
    dataset.reviewReport,
  );
  process.stdout.write(
    `Built ${dataset.reviewReport.totalEntries} entries: ${dataset.reviewReport.readyEntries} ready, ${dataset.reviewReport.needsReviewEntries} need review.\n`,
  );
}

async function readSourceLock(path: string): Promise<SourceLock> {
  const raw: unknown = JSON.parse(await readFile(path, "utf8"));
  if (
    !isRecord(raw) ||
    !isRecord(raw.sources) ||
    !isLockedRepositorySource(raw.sources.hsk) ||
    !isLockedRepositorySource(raw.sources.cvdict) ||
    !isLockedRepositorySource(raw.sources.kaiHanzi) ||
    !isLockedUnihanSource(raw.sources.unihan)
  ) {
    throw new Error("Invalid HSK source lock.");
  }

  return {
    sources: {
      hsk: raw.sources.hsk,
      cvdict: raw.sources.cvdict,
      kaiHanzi: raw.sources.kaiHanzi,
      unihan: raw.sources.unihan,
    },
  };
}

async function readAndVerify(
  path: string,
  expectedSha256: string | undefined,
): Promise<string> {
  if (expectedSha256 === undefined) {
    throw new Error(`No checksum is locked for ${path}.`);
  }

  const contents = await readFile(path, "utf8");
  const actualSha256 = createHash("sha256").update(contents).digest("hex");
  if (actualSha256 !== expectedSha256) {
    throw new Error(
      `Checksum mismatch for ${path}. Expected ${expectedSha256}, received ${actualSha256}.`,
    );
  }

  return contents;
}

async function writeJson(
  path: string,
  value: HskDataset | HskDataset["reviewReport"],
): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLockedRepositorySource(
  value: unknown,
): value is LockedRepositorySource {
  return (
    isRecord(value) &&
    typeof value.revision === "string" &&
    isRecord(value.files) &&
    Object.values(value.files).every((checksum) => typeof checksum === "string")
  );
}

function isLockedFileSource(value: unknown): value is LockedFileSource {
  return (
    isRecord(value) &&
    isRecord(value.files) &&
    Object.values(value.files).every((checksum) => typeof checksum === "string")
  );
}

function isLockedUnihanSource(value: unknown): value is LockedUnihanSource {
  return (
    isLockedFileSource(value) &&
    isRecord(value) &&
    typeof value.version === "string"
  );
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown HSK dataset build failure.";
  process.stderr.write(`HSK dataset build failed: ${message}\n`);
  process.exitCode = 1;
});
