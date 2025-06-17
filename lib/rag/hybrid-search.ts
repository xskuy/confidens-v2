/**
 * @fileoverview
 * This file contains the core logic for performing hybrid search.
 * It combines results from vector search and keyword search to provide
 * more relevant and accurate search results.
 */

import { search as keywordSearch } from '@/lib/rag/keyword-search';
import { search as vectorSearch } from '@/lib/rag/vector-search';
import type { SearchResult } from '@/lib/rag/types';

/**
 * Represents the configuration for the hybrid search.
 */
export interface HybridSearchConfig {
  /** The weight to apply to the vector search results (0 to 1). */
  vectorWeight: number;
  /** The weight to apply to the keyword search results (0 to 1). */
  keywordWeight: number;
  /** The number of results to fetch from each search. */
  topK: number;
}

/**
 * A constant used in the RRF calculation to diminish the impact of documents
 * with a very high rank. A common value is 60.
 */
const RRF_K = 60;

/**
 * Performs a hybrid search by combining vector and keyword search results.
 *
 * @param query The search query string.
 * @param config The configuration for the hybrid search.
 * @returns A promise that resolves to a list of combined and reranked search results.
 */
export async function hybridSearch(
  query: string,
  config: HybridSearchConfig = {
    vectorWeight: 0.5,
    keywordWeight: 0.5,
    topK: 20,
  },
): Promise<SearchResult[]> {
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(query, config.topK),
    keywordSearch(query, config.topK),
  ]);

  const combinedResults = rerank(vectorResults, keywordResults, config);

  // Debug: Buscar específicamente dónde están los chunks sobre ARPANET
  console.log(
    '\n🔍 DEBUG: Posiciones de chunks sobre ARPANET en resultado final:',
  );
  combinedResults.forEach((result, index) => {
    if (
      result.text.toLowerCase().includes('arpanet') ||
      result.text.toLowerCase().includes('departamento de defensa')
    ) {
      console.log(
        `  ENCONTRADO en posición ${index + 1}: "${result.text.substring(0, 80)}..." (Score: ${result.score?.toFixed(6)})`,
      );
    }
  });

  // Return only the top candidates after the initial ranking
  return combinedResults.slice(0, config.topK);
}

/**
 * Reranks and merges search results from vector and keyword searches.
 *
 * This implementation uses weighted Reciprocal Rank Fusion (RRF).
 *
 * @param vectorResults The results from the vector search.
 * @param keywordResults The results from the keyword search.
 * @param config The configuration for the hybrid search.
 * @returns An array of reranked and merged search results.
 */
function rerank(
  vectorResults: SearchResult[],
  keywordResults: SearchResult[],
  config: HybridSearchConfig,
): SearchResult[] {
  const scoreMap = new Map<string, number>();
  const resultMap = new Map<string, SearchResult>();

  // Process vector search results
  vectorResults.forEach((result, index) => {
    const rank = index + 1;
    const rrfScore = config.vectorWeight / (RRF_K + rank);

    scoreMap.set(result.id, (scoreMap.get(result.id) || 0) + rrfScore);
    if (!resultMap.has(result.id)) {
      resultMap.set(result.id, result);
    }
  });

  // Process keyword search results
  keywordResults.forEach((result, index) => {
    const rank = index + 1;
    const rrfScore = config.keywordWeight / (RRF_K + rank);

    scoreMap.set(result.id, (scoreMap.get(result.id) || 0) + rrfScore);
    if (!resultMap.has(result.id)) {
      resultMap.set(result.id, result);
    }
  });

  // Combine and sort results
  const combined = Array.from(resultMap.values()).map((result) => ({
    ...result,
    score: scoreMap.get(result.id) || 0,
  }));

  combined.sort((a, b) => b.score - a.score);

  return combined;
}
