import bm25s
from db import get_db_client, get_or_create_collections


def create_bm25_searcher(corpus: list[str]):
    """
    Initializes and fits a BM25 searcher on a given corpus.

    Args:
        corpus: A list of documents (chunks) to index.

    Returns:
        A fitted BM25 searcher instance.
    """
    print("Fitting BM25 model on the corpus...")
    # Tokenize the corpus using the library's recommended tokenizer
    corpus_tokens = bm25s.tokenize(corpus)

    # Create and index the BM25 model
    bm25_searcher = bm25s.BM25()
    bm25_searcher.index(corpus_tokens)

    print(f"BM25 model indexed on {len(corpus)} documents.")
    return bm25_searcher


def bm25_search(searcher, query: str, corpus_ids: list[str], k: int = 5):
    """
    Performs a BM25 search and returns the top-k results with their scores.

    Args:
        searcher: A fitted BM25 searcher instance.
        query: The search query.
        corpus_ids: A list of IDs corresponding to the documents in the corpus.
        k: The number of top results to return.

    Returns:
        A list of tuples, where each tuple contains (document_id, score).
    """
    # Tokenize the query
    query_tokens = bm25s.tokenize(query)

    # Get top-k results (indices and scores)
    # The result arrays are shaped (n_queries, k)
    doc_indices, scores = searcher.retrieve(query_tokens, k=k)

    # We are only passing one query, so we take the first row of results
    top_indices = doc_indices[0]
    top_scores = scores[0]

    # Create a list of (id, score) for the top results, filtering out zero scores
    results = [
        (corpus_ids[i], top_scores[idx])
        for idx, i in enumerate(top_indices)
        if top_scores[idx] > 0
    ]

    return results


if __name__ == "__main__":
    # --- Example Usage with ChromaDB data ---
    print("--- Testing BM25 Search with ChromaDB data ---")

    # 1. Connect to ChromaDB and get the embeddings collection
    client = get_db_client()
    _, embeddings_collection = get_or_create_collections(client)

    # 2. Fetch all documents from the collection
    # The get() method without IDs fetches all records.
    all_docs = embeddings_collection.get()

    if not all_docs or not all_docs["ids"]:
        print("ChromaDB collection is empty. Please run ingest.py first.")
    else:
        corpus_docs = all_docs["documents"]
        doc_ids = all_docs["ids"]
        print(f"Loaded {len(doc_ids)} documents from ChromaDB.")

        # 3. Create and index the BM25 searcher
        bm25_model = create_bm25_searcher(corpus_docs)

        # 4. Perform a test search
        test_query = "origen del internet"
        top_results = bm25_search(bm25_model, test_query, doc_ids, k=3)

        # 5. Print results
        print(f"\nQuery: '{test_query}'")
        print("Top BM25 Results from ChromaDB data:")
        if not top_results:
            print("  No relevant documents found.")
        else:
            for doc_id, score in top_results:
                # Find the original document content for display
                content = corpus_docs[doc_ids.index(doc_id)]
                print(f"  - ID: {doc_id}, Score: {score:.4f}")
                print(f"    Content: {content}")
