import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions


def get_db_client(path="./db"):
    """
    Initializes and returns a persistent ChromaDB client with reset enabled.
    """
    return chromadb.PersistentClient(path=path, settings=Settings(allow_reset=True))


def get_or_create_collections(client):
    """
    Gets or creates the 'resources' and 'embeddings' collections from a client,
    configuring the 'embeddings' collection to use the Qwen3-Embedding model.
    """
    resources_collection = client.get_or_create_collection(name="resources")

    # Define the embedding function using Sentence-Transformers
    # This will download and use the specified Qwen model.
    # The model name is based on its Hugging Face repository ID.
    qwen_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="Qwen/Qwen3-Embedding-0.6B",
        # Use 'cpu' if you don't have a compatible GPU or CUDA setup
        device="cpu",
    )

    # Pass the embedding function when creating the embeddings collection
    embeddings_collection = client.get_or_create_collection(
        name="embeddings", embedding_function=qwen_ef
    )

    return resources_collection, embeddings_collection


# Define collection names
RESOURCES_COLLECTION_NAME = "resources"
EMBEDDINGS_COLLECTION_NAME = "embeddings"
