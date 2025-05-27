import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash } from 'bcrypt-ts';
import { generateId } from 'ai';

// Cargar variables de entorno
config({ path: '.env.local' });

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not defined');
}

// Configuración específica para Supabase
const client = postgres(process.env.POSTGRES_URL, {
  ssl: 'require',
  max: 1,
  prepare: false,
  connection: {
    application_name: 'confidens_v2',
  },
});

export const db = drizzle(client);

export async function generateHashedPassword(
  password: string,
): Promise<string> {
  return hash(password, 10);
}

export async function generateDummyPassword(): Promise<string> {
  const password = generateId(12);
  return generateHashedPassword(password);
}
