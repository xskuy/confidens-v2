from ingest import ingest_resource
from db import get_db_client, get_or_create_collections
from hybrid_search import hybrid_search, rerank
from bm25_search import create_bm25_searcher
from transformers import AutoTokenizer, AutoModelForSequenceClassification


def main():
    """
    Main function to orchestrate the RAG process:
    1. Initialize DB client and reset it.
    2. Ingest multiple resources to create a richer dataset.
    3. Initialize all necessary models (BM25, Reranker).
    4. Perform a hybrid search followed by a rerank.
    5. Display the final results.
    """
    # 1. Initialize and reset the DB
    db_path = "./db"
    print("\n--- Initializing Database ---")
    client = get_db_client(path=db_path)
    print("Resetting database...")
    client.reset()
    resources_collection, embeddings_collection = get_or_create_collections(client)
    print("Database and collections are ready.")

    # 2. Ingest multiple resources
    print("\n--- Starting Data Ingestion ---")
    # Resource 1: History of the Internet
    internet_content = """El Internet, uno de los avances tecnológicos más significativos del siglo XX, transformó radicalmente la forma en que las personas interactúan, acceden a la información y hacen negocios. Sus orígenes se remontan a la década de 1960 con el desarrollo de ARPANET, una red experimental financiada por el Departamento de Defensa de los Estados Unidos. El propósito inicial de ARPANET era permitir la comunicación entre investigadores en diferentes universidades sin depender de una única línea de comunicación física.

Durante los años 70 y 80, se desarrollaron protocolos fundamentales como TCP/IP, que permitieron que múltiples redes se interconectaran y funcionaran como una sola. En 1989, Tim Berners-Lee propuso el sistema de hipertexto que daría origen a la World Wide Web, facilitando el acceso a información a través de navegadores. En la década de 1990, el Internet comenzó su expansión global. Empresas, gobiernos y particulares empezaron a conectarse, dando lugar a una economía digital.

El impacto del Internet en la sociedad ha sido profundo. En la educación, ha permitido el acceso masivo a cursos en línea, bibliotecas digitales y herramientas interactivas. En la economía, ha originado nuevas industrias, desde el comercio electrónico hasta el marketing digital, y ha transformado industrias tradicionales como el turismo, el transporte y la banca. También ha influido en la política, al facilitar la organización de movimientos sociales, la difusión de información y la vigilancia ciudadana.

Sin embargo, también ha traído desafíos: la desinformación, las violaciones a la privacidad, la adicción digital y la desigualdad en el acceso. A pesar de los esfuerzos por lograr una conectividad global, todavía hay más de 2.5 mil millones de personas sin acceso estable a Internet. El concepto de "brecha digital" refleja esta desigualdad, y es uno de los principales retos del siglo XXI.

En los últimos años, el surgimiento de tecnologías como la inteligencia artificial, el Internet de las cosas (IoT), y la computación en la nube ha vuelto al Internet aún más indispensable. La sociedad moderna depende del acceso constante a servicios digitales, desde la comunicación hasta la gestión de infraestructuras críticas.

En conclusión, el Internet no es solo una herramienta: es una infraestructura fundamental para el funcionamiento del mundo moderno. Su desarrollo y regulación determinarán gran parte del futuro social, económico y político de la humanidad."""
    ingest_resource(
        resources_collection=resources_collection,
        embeddings_collection=embeddings_collection,
        title="Historia del Internet",
        author="AI Assistant",
        content_type="article",
        version="1.0.0",
        content=internet_content,
        source="internal_document_1",
    )

    # Resource 2: Renewable Energy
    renewable_energy_content = """Los parques eólicos marinos (offshore) están compuestos por cientos de turbinas instaladas en plataformas fijas o flotantes sobre el océano. Cada aerogenerador consta de un rotor de tres palas, un eje de baja velocidad, un multiplicador de velocidad, un generador eléctrico y un sistema de control climático dentro de la góndola (“nacelle”). Según la profundidad y geología del lecho marino, se emplean distintos tipos de cimentación: monopilotes (hasta 30 m de profundidad), jackets (30–60 m) o estructuras flotantes ancladas con cables tensados para aguas más profundas.

Durante la fase de instalación, embarcaciones especializadas elevan y fijan cada sección (base, torre, góndola y rotor) mediante grúas de gran capacidad. Una vez montadas, las turbinas se interconectan con un “cable de inter-array” que recoge la electricidad generada a baja tensión y la conduce hasta una subestación offshore. Allí se eleva el voltaje mediante transformadores, para transportarla por cables submarinos de alto voltaje (AC o, en proyectos más distantes, HVDC) hasta la costa. En tierra, una subestación convertidora ajusta nuevamente tensión y frecuencia para su inyección segura en la red eléctrica nacional.

El monitor­eo remoto y los trabajos de operación y mantenimiento (O&M) se realizan desde bases portuarias, utilizando embarcaciones de servicio y drones para inspección de palas. Gracias a los vientos más fuertes y constantes en alta mar, estos parques alcanzan factores de capacidad del 50–60 %, ofrecen generación estable y reducen significativamente las emisiones de CO₂, contribuyendo a la descarbonización y seguridad energética."""
    ingest_resource(
        resources_collection=resources_collection,
        embeddings_collection=embeddings_collection,
        title="Energías Renovables",
        author="AI Assistant",
        content_type="article",
        version="1.0.0",
        content=renewable_energy_content,
        source="internal_document_2",
    )
    print("--- Data Ingestion Complete ---")

    # 3. Initialize models and searchers for Hybrid Search
    print("\n--- Initializing Models for Hybrid Search ---")
    RERANKER_MODEL_NAME = "BAAI/bge-reranker-large"
    DEVICE = "cpu"  # Change to "cuda" if you have a GPU

    # Load corpus from DB for BM25
    all_docs = embeddings_collection.get()
    corpus_docs = all_docs["documents"]
    corpus_ids = all_docs["ids"]
    print(f"Loaded {len(corpus_ids)} documents from DB for BM25.")

    # Create BM25 searcher
    bm25_model = create_bm25_searcher(corpus_docs)
    print("BM25 model created.")

    # Load Reranker model
    print(f"Loading reranker model: {RERANKER_MODEL_NAME}...")
    reranker_tokenizer = AutoTokenizer.from_pretrained(RERANKER_MODEL_NAME)
    reranker_model = AutoModelForSequenceClassification.from_pretrained(
        RERANKER_MODEL_NAME
    ).to(DEVICE)

    # Set pad_token to eos_token and resize embeddings if necessary
    if reranker_tokenizer.pad_token is None:
        reranker_tokenizer.pad_token = reranker_tokenizer.eos_token
        reranker_tokenizer.pad_token_id = reranker_tokenizer.eos_token_id
        reranker_model.resize_token_embeddings(len(reranker_tokenizer))

    print("Reranker model loaded.")

    # 4. Perform Hybrid Search and Rerank
    print("\n--- Starting Hybrid Search & Rerank ---")
    query_text = "Considerando los desarrollos de la década de 1980 y la propuesta de 1989, ¿qué innovaciones fueron cruciales para que Internet dejara de ser una red experimental y se expandiera globalmente? A su vez, ¿cómo se contrasta este éxito con el principal reto social que afecta a 2.5 mil millones de personas?"
    SIGMOID_MIN = 0.65  # 30% probabilidad sigmoid ≈ mínimo relevante

    # Híbrida con agrupación por documento antes del reranking
    fused_results = hybrid_search(
        query=query_text,
        embeddings_collection=embeddings_collection,
        bm25_searcher=bm25_model,
        corpus_ids=corpus_ids,
        k_final=20,
        group_by_doc=True,  # Agrupar chunks por documento base
    )

    # Rerank con umbral sigmoid para filtrar contenido irrelevante
    reranked_results = rerank(
        query=query_text,
        docs_ids_scores=fused_results,
        reranker_model=reranker_model,
        reranker_tokenizer=reranker_tokenizer,
        collection=embeddings_collection,
        device=DEVICE,
        min_sigmoid=SIGMOID_MIN,  # Usar probabilidad sigmoid en lugar de logits
    )

    print(f"\n--- Final Reranked Results for query: '{query_text}' ---")
    if not reranked_results:
        print("No relevant documents found.")
    else:
        for i, (doc_id, score) in enumerate(reranked_results):
            # Mostrar también score sigmoid para debug
            import torch

            sigmoid_score = torch.sigmoid(torch.tensor(score)).item()
            content = embeddings_collection.get(ids=[doc_id])["documents"][0]
            print(
                f"  {i + 1}. ID: {doc_id}, Logit: {score:.4f}, Sigmoid: {sigmoid_score:.4f}"
            )
            print(f"     Content: {content}\n")

    print("--- Process Complete ---")


if __name__ == "__main__":
    main()
