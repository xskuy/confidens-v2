import uuid
import datetime

from langchain_text_splitters import RecursiveCharacterTextSplitter


def ingest_resource(
    resources_collection,
    embeddings_collection,
    title,
    author,
    content_type,
    version,
    content,
    source,
):
    """
    Processes a resource, stores its metadata, chunks its content,
    and stores the embeddings.
    """
    # 1. Define and store the main resource information
    resource_id = str(uuid.uuid4())
    created_at = datetime.datetime.utcnow().isoformat()

    resources_collection.add(
        ids=[resource_id],
        metadatas=[
            {
                "title": title,
                "author": author,
                "type": content_type,
                "version": version,
                "source": source,
                "created_at": created_at,
            }
        ],
        # The 'content' of the resource is stored as a document here
        documents=[content],
    )
    print(f"\nSuccessfully stored resource '{title}' ({resource_id}).")

    # 2. Chunk the resource content using LangChain's RecursiveCharacterTextSplitter
    # This splitter is more effective at preserving semantic context.
    # 100 tokens (~400 chars) con 20 tokens (~80 chars) de solapamiento para granularidad fina
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,   # ~100 tokens aprox. para enfocar temática
        chunk_overlap=80,  # ~20 tokens de solapamiento
        length_function=len,
        is_separator_regex=False,
    )

    chunks = text_splitter.split_text(content)
    print(
        f"Resource split into {len(chunks)} chunks with target size of 300 tokens (~1200 chars)."
    )

    # 3. Prepare and store each chunk in the 'embeddings' collection
    if not chunks:
        print("No chunks to add for this resource.")
        return resource_id

    embedding_ids = [str(uuid.uuid4()) for _ in chunks]
    enriched_metadatas = [
        {
            "resource_id": resource_id,
            "chunk_index": i,
            "length": len(chunk),
            "semantic_tags": ",".join(["space", "telescope", "astronomy"]),
        }
        for i, chunk in enumerate(chunks)
    ]

    embeddings_collection.add(
        ids=embedding_ids, documents=chunks, metadatas=enriched_metadatas
    )
    print(f"Added {len(chunks)} embeddings to the collection.")
    
    return resource_id
