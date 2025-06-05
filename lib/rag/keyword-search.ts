/**
 * @fileoverview
 * This file contains the logic for performing keyword-based search.
 * In a real implementation, this could use a library like Fuse.js,
 * or a full-text search database like Elasticsearch which uses BM25.
 */

import { sql } from 'drizzle-orm';
import { db } from '@/lib/rag/db';
import { embeddings } from '@/lib/rag/db/schema/embeddings';
import type { SearchResult } from '@/lib/rag/types';

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

  // Use websearch_to_tsquery to handle more flexible user queries.
  // The 'english' config is used for stemming and stop-word removal.
  const tsQuery = sql`websearch_to_tsquery('english', ${query})`;

  // Calculate the relevance score using ts_rank.
  const rank = sql<number>`ts_rank(to_tsvector('english', ${embeddings.content}), ${tsQuery})`;

  const results = await db
    .select({
      id: embeddings.id,
      text: embeddings.content,
      score: rank,
      metadata: {
        resourceId: embeddings.resourceId,
      },
    })
    .from(embeddings)
    .where(sql`${embeddings.content} @@ ${tsQuery}`)
    .orderBy(sql`${rank} DESC`)
    .limit(limit);

  return results;
}
