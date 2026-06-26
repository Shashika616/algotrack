import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { 
  prepare: false, 
  max: 3,                      // Set to 1 connection during troubleshooting to isolate pools
  connect_timeout: 20,          // Instantly fail fast after 5 seconds instead of letting Next.js hang
  idle_timeout: 15,            // Swiftly terminate idle clients
  onnotice: () => {},          // Silence notices to free up connection processing
});

export const db = drizzle(client, { schema });