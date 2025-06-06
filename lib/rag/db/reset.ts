import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

config({
  path: '.env.local',
});

const runReset = async () => {
  if (!process.env.VECTOR_DATABASE_URL) {
    throw new Error('VECTOR_DATABASE_URL is not defined');
  }

  const connection = postgres(process.env.VECTOR_DATABASE_URL, { max: 1 });
  const db = drizzle(connection);

  console.log('⏳ Resetting RAG database...');
  const start = Date.now();

  try {
    console.log('  - Dropping table: embeddings');
    await db.execute(sql`DROP TABLE IF EXISTS "embeddings" CASCADE`);
    console.log('  - Dropping table: resources');
    await db.execute(sql`DROP TABLE IF EXISTS "resources" CASCADE`);
    console.log('  - Dropping table: __drizzle_migrations');
    await db.execute(sql`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE`);
    console.log('✅ RAG database reset completed.');
  } catch (error) {
    console.error('❌ Error resetting RAG database:', error);
    process.exit(1);
  } finally {
    const end = Date.now();
    console.log(`⏱️ Reset finished in ${end - start}ms`);
    process.exit(0);
  }
};

runReset();
