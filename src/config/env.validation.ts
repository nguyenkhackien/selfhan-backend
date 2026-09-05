import { z } from "zod";

export const APPLICATION_LOG_LEVELS = [
  "trace",
  "debug",
  "verbose",
  "info",
  "warn",
  "error",
  "fatal",
] as const;

export const LOG_FORMATS = ["pretty", "json"] as const;

export type ApplicationLogLevel = (typeof APPLICATION_LOG_LEVELS)[number];
export type LogFormat = (typeof LOG_FORMATS)[number];

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRATION: z.string().default("15m"),
  FRONTEND_ORIGIN: z.string().url(),
  LOG_LEVEL: z.enum(APPLICATION_LOG_LEVELS).default("trace"),
  LOG_FORMAT: z.enum(LOG_FORMATS).optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  const result = environmentSchema.safeParse(config);

  if (!result.success) {
    throw new Error(
      `Invalid environment configuration: ${result.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")}`,
    );
  }

  return result.data;
}
