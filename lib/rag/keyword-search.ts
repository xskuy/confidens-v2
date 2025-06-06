/**
 * @fileoverview
 * This file contains the logic for performing keyword-based search.
 * In a real implementation, this could use a library like Fuse.js,
 * or a full-text search database like Elasticsearch which uses BM25.
 */

import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/rag/db';
import { embeddings } from '@/lib/rag/db/schema/embeddings';
import type { SearchResult } from '@/lib/rag/types';
import { resources } from '@/lib/rag/db/schema/resources';

/**
 * Performs a keyword-based full-text search using PostgreSQL.
 *
 * @param query The search query string.
 * @param limit The maximum number of results to return.
 * @returns A promise that resolves to a list of search results.
 */
export async function search(
  query: string,
  limit = 10,
): Promise<SearchResult[]> {
  console.log(`Performing keyword search for: "${query}"`);

  const tsquery = sql`plainto_tsquery('spanish', ${query})`;

  const results = await db
    .select({
      id: embeddings.id,
      text: embeddings.content,
      source: resources.source,
      score: sql`ts_rank(to_tsvector('spanish', ${embeddings.content}), ${tsquery})`,
    })
    .from(embeddings)
    .innerJoin(resources, eq(embeddings.resourceId, resources.id))
    .where(sql`to_tsvector('spanish', ${embeddings.content}) @@ ${tsquery}`)
    .orderBy(
      sql`ts_rank(to_tsvector('spanish', ${embeddings.content}), ${tsquery}) DESC`,
    )
    .limit(limit);

  return results as SearchResult[];
}
