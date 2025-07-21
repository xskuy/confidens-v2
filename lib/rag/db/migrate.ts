import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const runMigrate = async () => {
  if (!process.env.VECTOR_DATABASE_URL) {
    throw new Error('VECTOR_DATABASE_URL is not defined');
  }

  const connection = postgres(process.env.VECTOR_DATABASE_URL, { max: 1 });
  const db = drizzle(connection);

  console.log('⏳ Running RAG migrations...');
  const migrationsFolder = './lib/rag/db/migrations';
  console.log(`  - Reading migrations from: ${migrationsFolder}`);

  const start = Date.now();
  await migrate(db, { migrationsFolder });
  const end = Date.now();

  console.log('✅ RAG migrations completed in', end - start, 'ms');
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error('❌ RAG migration failed');
  console.error(err);
  process.exit(1);
});
