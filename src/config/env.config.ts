import { config } from 'dotenv';

config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function requireEnvNumber(key: string): number {
  const raw = requireEnv(key);
  const num = Number(raw);
  if (isNaN(num)) {
    throw new Error(
      `Environment variable ${key} must be a number, got: "${raw}"`,
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
} as const;
