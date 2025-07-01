/**
 * @fileoverview
 * This file defines the common types used across the RAG module.
 */

/**
 * Represents a single search result item.
 */
export interface SearchResult {
  /** A unique identifier for the search result. */
  id: string;
  /** The relevance score of the search result. */
  score: number;
  /** The main content or text of the result. */
  text: string;
  /** Additional metadata associated with the result. */
  metadata?: Record<string, any>;
}
