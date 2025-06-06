import { sql } from 'drizzle-orm';
import { text, varchar, timestamp, pgTable } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { nanoid } from '@/lib/rag/utils';

export const resources = pgTable('resources', {
  id: varchar('id', { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  content: text('content').notNull(),
  source: varchar('source', { length: 255 }), // e.g., filename, URL
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

// Manually define the Zod schema for insertion to avoid library conflicts.
export const insertResourceSchema = z.object({
  content: z.string().min(1),
  source: z.string().optional(),
});

// Type for resources - used to type API request params and within Components
export type NewResourceParams = z.infer<typeof insertResourceSchema>;
