import torch
import numpy as np
from collections import defaultdict
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from ..database.db import get_db_client, get_or_create_collections
from .bm25_search import create_bm25_searcher, bm25_search


# ----------------------------------------------------------------------
# 1. Cross-encoder utilitario: calcula la probabilidad "relevante"
# ----------------------------------------------------------------------
def get_relevance_scores(query, texts, tokenizer, model, device="cpu"):
    inputs = tokenizer(
        [query] * len(texts),
        texts,
        padding=True,
        truncation=True,
        return_tensors="pt",
    ).to(device)
    with torch.no_grad():
        logits = model(**inputs).logits.squeeze(-1)
    # bge-reranker / similares: valor alto ⇒ más relevante
    return logits.tolist() if logits.ndim == 1 else logits[:, 1].tolist()


# ----------------------------------------------------------------------
# 1.5. Diversificación de resultados usando MMR con embeddings reales
# ----------------------------------------------------------------------
def get_real_embeddings(doc_ids, collection):
    """
    Obtiene embeddings reales de ChromaDB para los documentos.
    """
    try:
        docs = collection.get(ids=doc_ids, include=["embeddings"])
        embeddings = np.array(docs["embeddings"], dtype=np.float32)
        return embeddings
    except Exception:
        # Fallback: embeddings aleatorios normalizados
        embeddings = np.random.rand(len(doc_ids), 384).astype(np.float32)
        # Normalizar a unit-norm
        norms = np.sqrt(np.sum(embeddings**2, axis=1, keepdims=True))
        return embeddings / np.maximum(norms, 1e-8)


def diversify_results_advanced(
    docs_ids_scores,
    texts,
    collection,
    lambda_param=0.65,
    top_k=5,
    max_per_doc=1,
    min_threshold=None,
):
    """
    MMR avanzado con embeddings reales de ChromaDB y agrupación por documento.

    Args:
        docs_ids_scores: Lista de (doc_id, relevance_score) - logits del reranker
        texts: Lista de textos correspondientes
        collection: Colección ChromaDB
        lambda_param: Balance relevancia vs diversidad (0.55 recomendado)
        top_k: Número máximo de resultados
        max_per_doc: Máximo pasajes por documento (1 recomendado)
        min_threshold: Umbral mínimo de relevancia (sigmoid normalizado)
    """
    if len(docs_ids_scores) <= 1:
        return docs_ids_scores

    # Normalizar relevancia con sigmoid para rango estable [0,1]
    import torch

    logits = torch.tensor([score for _, score in docs_ids_scores])
    relevance_scores = torch.sigmoid(logits).tolist()

    # Filtrar por umbral si está definido
    if min_threshold is not None:
        filtered_data = [
            (docs_ids_scores[i], relevance_scores[i], texts[i])
            for i in range(len(docs_ids_scores))
            if relevance_scores[i] >= min_threshold
        ]
        if not filtered_data:
            return []
        docs_ids_scores = [item[0] for item in filtered_data]
        relevance_scores = [item[1] for item in filtered_data]
        texts = [item[2] for item in filtered_data]

    # Obtener embeddings reales de ChromaDB
    doc_ids = [doc_id for doc_id, _ in docs_ids_scores]
    embeddings = get_real_embeddings(doc_ids, collection)

    # Preparar datos con agrupación por documento
    doc_groups = {}
    doc_metadatas = collection.get(ids=doc_ids, include=["metadatas"])["metadatas"]

    for i, (doc_id, _) in enumerate(docs_ids_scores):
        # Extraer ID base del documento (resource_id)
        metadata = doc_metadatas[i]
        base_doc_id = metadata.get("resource_id", doc_id)

        if base_doc_id not in doc_groups:
            doc_groups[base_doc_id] = []
        doc_groups[base_doc_id].append(
            {
                "index": i,
                "doc_id": doc_id,
                "relevance": relevance_scores[i],
                "embedding": embeddings[i],
                "text": texts[i],
            }
        )

    # Ordenar dentro de cada grupo por relevancia
    for group in doc_groups.values():
        group.sort(key=lambda x: x["relevance"], reverse=True)

    selected = []
    used_docs = set()
    doc_counts = {}

    # Seleccionar documentos usando MMR
    while len(selected) < top_k:
        best_mmr = -float("inf")
        best_candidate = None

        # Evaluar todos los candidatos disponibles
        for base_doc_id, group in doc_groups.items():
            current_count = doc_counts.get(base_doc_id, 0)
            if current_count >= max_per_doc:
                continue

            # Buscar el siguiente mejor candidato de este documento
            for candidate in group:
                if candidate["index"] in used_docs:
                    continue

                relevance = candidate["relevance"]

                # Calcular diversidad usando distancia coseno directa
                diversity = 1.0  # Máxima diversidad inicial
                if selected:
                    similarities = []
                    for sel in selected:
                        # Similitud coseno directa (embeddings ya están normalizados)
                        similarity = np.dot(candidate["embedding"], sel["embedding"])
                        similarities.append(max(0, similarity))  # Clamp a [0,1]
                    diversity = 1.0 - max(
                        similarities
                    )  # Diversidad = 1 - max_similitud

                # MMR score
                mmr_score = lambda_param * relevance + (1 - lambda_param) * diversity

                if mmr_score > best_mmr:
                    best_mmr = mmr_score
                    best_candidate = (candidate, base_doc_id)
                break  # Solo el mejor de cada documento por iteración

        if best_candidate is None:
            break  # No hay más candidatos válidos

        candidate, base_doc_id = best_candidate
        selected.append(candidate)
        used_docs.add(candidate["index"])
        doc_counts[base_doc_id] = doc_counts.get(base_doc_id, 0) + 1

    # Umbral dinámico: si tenemos muy pocos resultados, relajar el umbral
    if len(selected) < max(2, top_k // 2) and min_threshold is not None:
        new_threshold = min_threshold * 0.8  # Reducir umbral 20%
        print(f"DEBUG: Relajando umbral de {min_threshold:.3f} a {new_threshold:.3f}")
        return diversify_results_advanced(
            docs_ids_scores,
            texts,
            collection,
            lambda_param,
            top_k,
            max_per_doc,
            new_threshold,
        )

    # Retornar resultados finales con scores originales
    return [(sel["doc_id"], docs_ids_scores[sel["index"]][1]) for sel in selected]


# ----------------------------------------------------------------------
# 1.6. Función de validación rápida
# ----------------------------------------------------------------------
def validate_mmr_results(results, collection, max_per_doc=1):
    """
    Valida que los resultados MMR cumplan las restricciones esperadas.
    """
    if not results:
        return {"valid": True, "stats": {}}

    # Verificar que ningún documento se repite más de max_per_doc
    doc_counts = {}
    doc_ids = [doc_id for doc_id, _ in results]

    if not doc_ids:
        return {"valid": True, "stats": {}}

    metadatas = collection.get(ids=doc_ids, include=["metadatas"])["metadatas"]

    for i, (doc_id, _) in enumerate(results):
        metadata = metadatas[i]
        base_doc_id = metadata.get("resource_id", doc_id)
        doc_counts[base_doc_id] = doc_counts.get(base_doc_id, 0) + 1

    max_count = max(doc_counts.values()) if doc_counts else 0
    valid_doc_limit = max_count <= max_per_doc

    # Calcular relevancia media
    scores = [score for _, score in results]
    avg_relevance = sum(scores) / len(scores) if scores else 0

    return {
        "valid": valid_doc_limit,
        "max_doc_count": max_count,
        "avg_relevance": avg_relevance,
        "num_results": len(results),
        "unique_docs": len(doc_counts),
    }


# ----------------------------------------------------------------------
# 2. Fusion RRF (sin cambios)
# ----------------------------------------------------------------------
def rrf_fuse(rank_lists, k=60):
    scores = defaultdict(float)
    for rank_list in rank_lists:
        for r, (doc_id, _) in enumerate(rank_list, start=1):
            scores[doc_id] += 1 / (k + r)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)


# ----------------------------------------------------------------------
# 3. Re-ranker genérico, sin filtros hard-coded
# ----------------------------------------------------------------------
def rerank(
    query,
    docs_ids_scores,
    reranker_tokenizer,
    reranker_model,
    collection,
    device="cpu",
    min_sigmoid=None,
    diversify=True,
    lambda_param=0.65,
    max_per_doc: int = 1,
):
    def _shorten_query(q: str, tokenizer, max_tokens: int = 64) -> str:
        """Recorta la query para que no exceda `max_tokens`, evitando que el texto del pasaje se trunque demasiado."""
        tokens = tokenizer.encode(q, add_special_tokens=False)
        if len(tokens) <= max_tokens:
            return q
        # Mantener primeros 40 tokens y últimos 24 tokens (por si hay términos clave al final)
        keep_first, keep_last = 40, max_tokens - 40
        shortened_ids = tokens[:keep_first] + tokens[-keep_last:]
        return tokenizer.decode(shortened_ids, skip_special_tokens=True)

    if not docs_ids_scores:
        return []

    # Recortar query para el reranker
    query_for_rerank = _shorten_query(query, reranker_tokenizer)

    doc_ids = [d for d, _ in docs_ids_scores]
    texts = collection.get(ids=doc_ids)["documents"]

    scores = get_relevance_scores(
        query_for_rerank, texts, reranker_tokenizer, reranker_model, device
    )
    paired = [(d, s) for (d, _), s in zip(docs_ids_scores, scores)]
    paired.sort(key=lambda x: x[1], reverse=True)

    # Filtro con probabilidad sigmoid en lugar de logits crudos
    if min_sigmoid is not None:
        paired = [
            p for p in paired if torch.sigmoid(torch.tensor(p[1])).item() >= min_sigmoid
        ]

    # Aplicar diversificación MMR avanzada si está habilitada
    if diversify and len(paired) > 1:
        final_results = diversify_results_advanced(
            paired,
            texts,
            collection,
            lambda_param,
            top_k=len(paired),
            max_per_doc=max_per_doc,
            min_threshold=min_sigmoid,
        )

        # Validar resultados sobre la lista final diversificada
        validation = validate_mmr_results(
            final_results, collection, max_per_doc=max_per_doc
        )
        print(f"DEBUG: MMR validation: {validation}")

        return final_results

    # Si no se diversifica, retornar los resultados rerankeados directamente
    # Ordenados por score de mayor a menor
    return sorted(paired, key=lambda x: x[1], reverse=True)


# ----------------------------------------------------------------------
# 4. Búsqueda híbrida genérica
# ----------------------------------------------------------------------
def group_by_document(fused_results):
    """
    Agrupa chunks por documento base y mantiene el mejor score RRF por documento.

    Ejemplo: Si "AI/IoT/cloud" y "WWW 1989" están en el mismo documento,
    mantiene solo el chunk que mejor puntúe en la fusión híbrida.
    """
    doc_groups = {}
    for doc_id, score in fused_results:
        # Extraer ID base del documento (sin sufijos de chunk)
        base_doc_id = doc_id.split("-")[0] if "-" in doc_id else doc_id
        if base_doc_id not in doc_groups or score > doc_groups[base_doc_id][1]:
            doc_groups[base_doc_id] = (doc_id, score)

    print(
        f"DEBUG: Agrupación redujo de {len(fused_results)} chunks a {len(doc_groups)} documentos únicos"
    )
    return list(doc_groups.values())


def hybrid_search(
    query,
    embeddings_collection,
    bm25_searcher,
    corpus_ids,
    k_vec=20,
    k_bm25=20,
    k_final=10,
    group_by_doc=False,  # Default changed to False to allow reranking multiple chunks from the same doc
):
    """
    Realiza una búsqueda híbrida combinando búsqueda vectorial y BM25,
    con la opción de agrupar por documento.
    """
    num_docs = len(corpus_ids)
    k_vec, k_bm25 = min(k_vec, num_docs), min(k_bm25, num_docs)

    vec = embeddings_collection.query(query_texts=[query], n_results=k_vec)

    # ChromaDB devuelve distancias (menor = más similar).
    # Convertimos a *similaridad* para que los sistemas de ranking que
    # esperan "mayor = mejor" (como RRF) funcionen correctamente.
    vec_ranked = []
    for doc_id, dist in zip(vec["ids"][0], vec["distances"][0]):
        # Similaridad simple: 1 / (1 + distancia)
        similarity = 1.0 / (1.0 + dist)
        vec_ranked.append((doc_id, similarity))

    bm25_ranked = bm25_search(bm25_searcher, query, corpus_ids, k=k_bm25)

    fused = rrf_fuse([vec_ranked, bm25_ranked])

    # Agrupar por documento antes del reranking si está habilitado
    if group_by_doc:
        fused = group_by_document(fused)

    return fused[:k_final]


# ----------------------------------------------------------------------
# 5. Ejemplo de uso
# ----------------------------------------------------------------------
if __name__ == "__main__":
    MODEL = "BAAI/bge-reranker-large"
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    QUERY = "¿Cuál fue el propósito inicial de ARPANET?"

    client = get_db_client()
    _, embed_coll = get_or_create_collections(client)

    all_docs = embed_coll.get()
    corpus_ids, corpus_texts = all_docs["ids"], all_docs["documents"]
    bm25 = create_bm25_searcher(corpus_texts)

    tok = AutoTokenizer.from_pretrained(MODEL)
    mdl = AutoModelForSequenceClassification.from_pretrained(MODEL).to(DEVICE)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
        mdl.resize_token_embeddings(len(tok))

    fused = hybrid_search(QUERY, embed_coll, bm25, corpus_ids)
    final = rerank(QUERY, fused, tok, mdl, embed_coll, DEVICE, min_sigmoid=None)

    for i, (doc_id, s) in enumerate(final, 1):
        print(f"{i}. {doc_id}  →  {s:.4f}")
