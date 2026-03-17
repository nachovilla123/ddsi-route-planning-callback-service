import { config } from 'dotenv';

config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function requireEnvNumber(key: string, minValue: number = 1): number {
  const raw = requireEnv(key);
  const num = Number(raw);
  if (isNaN(num)) {
    throw new Error(
      `Environment variable ${key} must be a number, got: "${raw}"`,
    );
  }
  if (num < minValue) {
    throw new Error(
      `Environment variable ${key} must be at least ${minValue}, got: ${num}`,
    );
  }
  return num;
}

function getEnvNumberOrDefault(
  key: string,
  defaultValue: number,
  minValue: number = 1,
): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const num = Number(raw);
  if (isNaN(num)) {
    throw new Error(
      `Environment variable ${key} must be a number, got: "${raw}"`,
    );
  }
  if (num < minValue) {
    throw new Error(
      `Environment variable ${key} must be at least ${minValue}, got: ${num}`,
    );
  }
  return num;
}

export const envConfig = {
  db: {
    host: requireEnv('DB_HOST'),
    port: requireEnvNumber('DB_PORT'),
    user: requireEnv('DB_USER'),
    pass: requireEnv('DB_PASS'),
    name: requireEnv('DB_NAME'),
  },
  port: requireEnvNumber('PORT'),

  webhook: {
    maxRetries: getEnvNumberOrDefault('WEBHOOK_MAX_RETRIES', 5, 1),
    timeoutMs: getEnvNumberOrDefault('WEBHOOK_TIMEOUT_MS', 5000, 1000),
    dispatchBatchSize: getEnvNumberOrDefault('DISPATCH_BATCH_SIZE', 10, 1),
  },

  planning: {
    planningBatchSize: getEnvNumberOrDefault('PLANNING_BATCH_SIZE', 5, 1),
  },
} as const;
