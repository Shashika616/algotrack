import { defineConfig } from 'drizzle-kit';
import { loadEnvConfig } from '@next/env';

// Explicitly load env variables from the project root folder directory
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Now safely loaded from .env.local
  },
});