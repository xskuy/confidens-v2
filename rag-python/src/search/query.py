def query_embeddings(
    resources_collection, embeddings_collection, query_text, n_results=2
):
    """
    Queries the embeddings collection and retrieves the full resource metadata
    for each relevant chunk.
    """
    # 1. Query the 'embeddings' collection to find relevant text chunks
    results = embeddings_collection.query(query_texts=[query_text], n_results=n_results)

    if not results or not results["ids"][0]:
        print("No relevant documents found.")
        return

    print(f"\n--- Found {len(results['ids'][0])} relevant chunks ---")

    # 2. For each result, retrieve the full resource details
    resource_ids = [meta["resource_id"] for meta in results["metadatas"][0]]
    # Remove duplicates before querying the resources collection
    unique_resource_ids = list(set(resource_ids))

    retrieved_resources = resources_collection.get(ids=unique_resource_ids)

    print("\n--- Query Results ---")
    print(f"Original Query: '{query_text}'\n")

    # 3. Combine and display the results
    for i, doc in enumerate(results["documents"][0]):
        chunk_meta = results["metadatas"][0][i]

        # Find the corresponding full resource metadata
        resource_id_to_find = chunk_meta["resource_id"]
        resource_info = None
        for j, res_id in enumerate(retrieved_resources["ids"]):
            if res_id == resource_id_to_find:
                resource_info = retrieved_resources["metadatas"][j]
                break

        print(f"Result {i + 1}:")
        print(f'  - Chunk Content: "{doc}"')
        if resource_info:
            print(
                f"  - (Source Resource: {resource_info.get('title', 'N/A')}, Author: {resource_info.get('author', 'N/A')})"
            )
        else:
            print("  - (Source resource information not found)")
        print(f"  - Chunk Metadata: {chunk_meta}")
        print("-" * 20)
