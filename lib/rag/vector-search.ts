/**
 * @fileoverview
 * This file contains the logic for performing vector-based semantic search.
 * This would typically involve a vector database like Pinecone, Weaviate, or pgvector.
 */

import { sql } from 'drizzle-orm';
import { db } from '@/lib/rag/db';
import { embeddings } from '@/lib/rag/db/schema/embeddings';
import { generateEmbedding } from '@/lib/rag/ai/embedding';
import type { SearchResult } from '@/lib/rag/types';

/**
 * Performs a vector-based semantic search using pgvector.
 *
 * @param query The search query string.
 * @param limit The maximum number of results to return.
 * @returns A promise that resolves to a list of search results.
 */
export async function search(
  query: string,
  limit = 10,
): Promise<SearchResult[]> {
  console.log(`Performing vector search for: "${query}"`);

  // 1. Generate an embedding for the user's query.
  const queryEmbedding = await generateEmbedding(query);

  // 2. Query the database for the most similar embeddings using cosine distance.
  // The `<=>` operator calculates the cosine distance (0=identical, 2=opposite).
  // We subtract from 1 to get cosine similarity (1=identical, -1=opposite).
  const similarity = sql<number>`1 - (${embeddings.embedding} <=> ${JSON.stringify(
    queryEmbedding,
  )})`;

  const results = await db
    .select({
      id: embeddings.id,
      text: embeddings.content,
      score: similarity,
      metadata: {
        resourceId: embeddings.resourceId,
      },
    })
    .from(embeddings)
    .orderBy((t) => sql`GREATEST(${t.score}, 0) DESC`)
    .limit(limit);

  return results;
}
