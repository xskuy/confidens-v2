import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '@/lib/rag/env.mjs';

// to-do: add ssl?
const client = postgres(env.VECTOR_DATABASE_URL);
export const db = drizzle(client);
