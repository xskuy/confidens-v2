import { env } from '@/lib/rag/env.mjs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(env.VECTOR_DATABASE_URL);
export const db = drizzle(client);
