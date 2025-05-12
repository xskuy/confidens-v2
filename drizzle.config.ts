import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Carga las variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL no está definido en las variables de entorno');
}

export default {
  schema: './lib/db/schema.ts', // Ruta a tu archivo de esquema
  out: './lib/db/migrations', // Directorio donde se guardarán las migraciones
  dialect: 'postgresql', // Especifica que usas PostgreSQL
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
