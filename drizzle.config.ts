import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Carga las variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

export default {
  schema: './lib/db/schema.ts', // Ruta a tu archivo de esquema
  out: './lib/db/migrations', // Directorio donde se guardarán las migraciones
  dialect: 'postgresql', // Especifica que usas PostgreSQL
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
