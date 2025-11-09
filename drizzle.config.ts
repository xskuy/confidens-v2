import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Carga las variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

if (!process.env.VECTOR_DATABASE_URL) {
  throw new Error(
    'VECTOR_DATABASE_URL no está definido en las variables de entorno',
  );
}

export default {
  schema: './lib/rag/db/schema/*', // Apunta al esquema del RAG
  out: './lib/rag/db/migrations', // Directorio para las migraciones del RAG
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.VECTOR_DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
