#!/usr/bin/env python3
"""
Servidor FastAPI para las APIs de RAG con Chroma.
Mantiene los modelos en memoria para máximo rendimiento.
"""

import logging
from contextlib import asynccontextmanager
from typing import List, Optional

import torch
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForSequenceClassification, AutoTokenizer

# Importar unstructured para procesamiento avanzado de PDFs
from unstructured.partition.pdf import partition_pdf
from unstructured.chunking.title import chunk_by_title

import sys
import os
import re
import tempfile

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.search.bm25_search import create_bm25_searcher
from src.database.db import get_db_client, get_or_create_collections
from src.search.hybrid_search import hybrid_search, rerank, validate_mmr_results
from src.ingestion.ingest import ingest_resource

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Variables globales para modelos (se cargan una sola vez)
app_state = {
    "db_client": None,
    "resources_collection": None,
    "embeddings_collection": None,
    "bm25_model": None,
    "reranker_model": None,
    "reranker_tokenizer": None,
    "device": "cpu",
}


# Modelos de datos con Pydantic
class IngestRequest(BaseModel):
    title: str
    author: Optional[str] = "Unknown"
    content_type: Optional[str] = "document"
    version: Optional[str] = "1.0.0"
    content: str
    source: str


class SearchRequest(BaseModel):
    query: str
    k_final: Optional[int] = (
        15  # Valores optimizados por defecto - aumentado para más contexto
    )
    min_sigmoid: Optional[float] = 0.1  # Muy reducido para permitir más resultados
    max_per_doc: Optional[int] = 8  # Aumentado para permitir más chunks por documento
    group_by_doc: Optional[bool] = False  # False para maximizar contexto relevante


class DocumentResponse(BaseModel):
    id: str
    title: str
    author: str
    type: str
    version: str
    source: str
    created_at: str
    content_preview: str
    content_length: int
    chunks_count: int


class SearchResultResponse(BaseModel):
    id: str
    content: str
    score: dict
    metadata: dict


class SearchResponse(BaseModel):
    success: bool
    results: List[SearchResultResponse]
    total_results: int
    context: str
    query: str
    message: str


class ListResponse(BaseModel):
    success: bool
    documents: List[DocumentResponse]
    total_resources: int
    total_chunks: int


class IngestResponse(BaseModel):
    success: bool
    resource_id: str
    chunks_count: int
    message: str


class DeleteRequest(BaseModel):
    resource_id: str


class DeleteResponse(BaseModel):
    success: bool
    resource_id: str
    chunks_deleted: int
    message: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializar modelos al inicio del servidor y limpiar al final"""
    logger.info("🚀 Iniciando servidor FastAPI RAG...")

    try:
        # Inicializar base de datos
        logger.info("📊 Conectando a ChromaDB...")
        db_path = "./db"
        app_state["db_client"] = get_db_client(path=db_path)
        resources_collection, embeddings_collection = get_or_create_collections(
            app_state["db_client"]
        )
        app_state["resources_collection"] = resources_collection
        app_state["embeddings_collection"] = embeddings_collection

        # Cargar corpus para BM25
        logger.info("🔍 Inicializando BM25...")
        all_docs = embeddings_collection.get()
        if all_docs["documents"]:
            app_state["bm25_model"] = create_bm25_searcher(all_docs["documents"])
            logger.info(f"✅ BM25 listo con {len(all_docs['documents'])} documentos")
        else:
            logger.info(
                "⚠️  No hay documentos para BM25, se inicializará con el primer documento"
            )

        # Cargar modelo de reranking
        logger.info("🤖 Cargando modelo de reranking...")
        RERANKER_MODEL_NAME = "BAAI/bge-reranker-large"
        app_state["device"] = "cpu"  # Cambiar a "cuda" si tienes GPU

        app_state["reranker_tokenizer"] = AutoTokenizer.from_pretrained(
            RERANKER_MODEL_NAME
        )
        app_state["reranker_model"] = (
            AutoModelForSequenceClassification.from_pretrained(RERANKER_MODEL_NAME).to(
                app_state["device"]
            )
        )

        # Configurar pad_token si es necesario
        if app_state["reranker_tokenizer"].pad_token is None:
            app_state["reranker_tokenizer"].pad_token = app_state[
                "reranker_tokenizer"
            ].eos_token
            app_state["reranker_tokenizer"].pad_token_id = app_state[
                "reranker_tokenizer"
            ].eos_token_id
            app_state["reranker_model"].resize_token_embeddings(
                len(app_state["reranker_tokenizer"])
            )

        logger.info("✅ Modelo de reranking cargado exitosamente")
        logger.info("🎉 Servidor RAG listo para recibir requests!")

        yield

    except Exception as e:
        logger.error(f"❌ Error durante inicialización: {e}")
        raise
    finally:
        logger.info("🔄 Cerrando servidor...")
        if app_state["db_client"]:
            # Limpiar recursos si es necesario
            pass


# Crear aplicación FastAPI
app = FastAPI(
    title="RAG API Server",
    description="Servidor de APIs para RAG con ChromaDB y búsqueda híbrida",
    version="1.0.0",
    lifespan=lifespan,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Función auxiliar para actualizar BM25
def update_bm25_if_needed():
    """Actualiza el modelo BM25 si hay nuevos documentos"""
    try:
        all_docs = app_state["embeddings_collection"].get()
        if all_docs["documents"]:
            app_state["bm25_model"] = create_bm25_searcher(all_docs["documents"])
            logger.info(
                f"🔄 BM25 actualizado con {len(all_docs['documents'])} documentos"
            )
    except Exception as e:
        logger.error(f"❌ Error actualizando BM25: {e}")


@app.get("/", tags=["Health"])
async def root():
    """Endpoint de salud del servidor"""
    return {
        "message": "🚀 RAG API Server running!",
        "status": "healthy",
        "endpoints": ["/docs", "/ingest", "/list", "/search", "/delete"],
    }


@app.post("/api/ingest", response_model=IngestResponse, tags=["Documents"])
async def ingest_document(request: IngestRequest):
    """Ingestar un documento en ChromaDB"""
    try:
        logger.info(f"📥 Ingiriendo documento: {request.title}")

        # Contar documentos antes
        before_count = app_state["embeddings_collection"].count()

        # Ingestar documento
        resource_id = ingest_resource(
            resources_collection=app_state["resources_collection"],
            embeddings_collection=app_state["embeddings_collection"],
            title=request.title,
            author=request.author,
            content_type=request.content_type,
            version=request.version,
            content=request.content,
            source=request.source,
        )

        # Contar documentos después
        after_count = app_state["embeddings_collection"].count()
        chunks_added = after_count - before_count

        # Actualizar BM25 en background
        update_bm25_if_needed()

        logger.info(f"✅ Documento ingresado: {resource_id} ({chunks_added} chunks)")

        return IngestResponse(
            success=True,
            resource_id=resource_id,
            chunks_count=chunks_added,
            message=f"Successfully ingested document '{request.title}'",
        )

    except Exception as e:
        logger.error(f"❌ Error en ingesta: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error ingesting document: {str(e)}"
        )


@app.post("/api/ingest/pdf", response_model=IngestResponse, tags=["Documents"])
async def ingest_pdf(
    pdf_file: UploadFile = File(...),
    title: str = Form(None),
    author: str = Form("Unknown"),
    version: str = Form("1.0.0"),
    source: str = Form("upload"),
):
    """Ingestar un PDF (archivo) en ChromaDB con procesamiento avanzado.

    1. Usa unstructured para extraer elementos estructurados del PDF
    2. Filtra elementos del índice de contenido
    3. Usa chunking semántico para preservar contexto
    """
    try:
        logger.info(
            f"📥 Ingestando PDF con procesamiento avanzado: {pdf_file.filename}"
        )

        # Usar nombre del archivo como título si no se provee
        if not title:
            title = pdf_file.filename.rsplit(".", 1)[0]

        # Leer contenido del PDF en memoria y guardarlo temporalmente
        pdf_content = await pdf_file.read()

        # Crear archivo temporal para unstructured
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(pdf_content)
            temp_file_path = temp_file.name

        try:
            # Paso 1: Extraer elementos estructurados con unstructured
            logger.info("🔍 Extrayendo elementos estructurados del PDF...")
            elements = partition_pdf(temp_file_path)
            logger.info(f"📄 Extraídos {len(elements)} elementos del PDF")

            # Paso 2: Filtrar elementos del índice de contenido
            logger.info("🚫 Filtrando elementos del índice de contenido...")
            filtered_elements = []
            index_patterns = [
                r"\.{2,}\s*\d+$",  # Líneas que terminan en puntos seguidos y número de página
                r"^índice",  # Líneas que empiezan con "índice"
                r"^tabla de contenido",  # Tabla de contenido
                r"^contenido",  # Solo "contenido"
                r"^\d+\.\d+.*\d+$",  # Patrones como "1.1 Tema ... 15"
            ]

            for element in elements:
                element_text = element.text.lower().strip()

                # Filtrar elementos vacíos o muy cortos
                if len(element_text) < 10:
                    continue

                # Filtrar elementos del índice
                is_index_element = False
                for pattern in index_patterns:
                    if re.search(pattern, element_text, re.IGNORECASE):
                        is_index_element = True
                        break

                # Filtrar elementos ListItem que parecen índice
                if (
                    hasattr(element, "category")
                    and element.category == "ListItem"
                    and re.search(r"\.{2,}\s*\d+$", element.text)
                ):
                    is_index_element = True

                if not is_index_element:
                    filtered_elements.append(element)

            logger.info(
                f"✅ Filtrados {len(elements) - len(filtered_elements)} elementos del índice"
            )
            logger.info(f"📝 Elementos restantes: {len(filtered_elements)}")

            if not filtered_elements:
                raise HTTPException(
                    status_code=400,
                    detail="No se encontró contenido válido después del filtrado.",
                )

            # Paso 3: Chunking semántico con unstructured
            logger.info("🧩 Aplicando chunking semántico...")
            chunks = chunk_by_title(
                filtered_elements,
                max_characters=1200,  # Tamaño de chunk optimizado
                combine_text_under_n_chars=300,  # Combinar textos pequeños
                overlap=100,  # Overlap para mantener contexto
            )

            logger.info(f"📦 Creados {len(chunks)} chunks semánticos")

            # Paso 4: Preparar texto final con metadatos de página y sección
            processed_chunks = []
            for i, chunk in enumerate(chunks):
                chunk_text = chunk.text.strip()
                if len(chunk_text) < 50:  # Filtrar chunks muy pequeños
                    continue

                # Añadir metadatos de contexto
                metadata_prefix = f"[Fragmento {i + 1}]"

                # Si el chunk tiene metadatos de página, añadirlos
                if hasattr(chunk, "metadata") and chunk.metadata:
                    # Convertir ElementMetadata a dict para acceder a los valores
                    metadata_dict = (
                        chunk.metadata.to_dict()
                        if hasattr(chunk.metadata, "to_dict")
                        else {}
                    )
                    page_number = metadata_dict.get("page_number") or getattr(
                        chunk.metadata, "page_number", None
                    )
                    if page_number:
                        metadata_prefix += f" [Página {page_number}]"

                processed_text = f"{metadata_prefix}\n{chunk_text}"
                processed_chunks.append(processed_text)

            if not processed_chunks:
                raise HTTPException(
                    status_code=400,
                    detail="No se generaron chunks válidos después del procesamiento.",
                )

            # Paso 5: Combinar chunks en texto final
            final_text = "\n\n".join(processed_chunks)
            logger.info(
                f"📄 Texto final: {len(final_text)} caracteres en {len(processed_chunks)} fragmentos"
            )

        finally:
            # Limpiar archivo temporal
            os.unlink(temp_file_path)

        # Contar documentos antes para calcular los añadidos
        before_count = app_state["embeddings_collection"].count()

        # Ingestar el texto procesado
        resource_id = ingest_resource(
            resources_collection=app_state["resources_collection"],
            embeddings_collection=app_state["embeddings_collection"],
            title=title,
            author=author,
            content_type="pdf",
            version=version,
            content=final_text,
            source=source,
        )

        # Contar después de la ingesta
        after_count = app_state["embeddings_collection"].count()
        chunks_added = after_count - before_count

        update_bm25_if_needed()

        logger.info(
            f"✅ PDF procesado exitosamente: {resource_id} ({chunks_added} chunks)"
        )

        return IngestResponse(
            success=True,
            resource_id=resource_id,
            chunks_count=chunks_added,
            message=f"Successfully processed PDF '{title}' with advanced filtering",
        )

    except HTTPException:
        # Re-lanzar para FastAPI
        raise
    except Exception as e:
        logger.error(f"❌ Error en procesamiento avanzado de PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@app.get("/api/list", response_model=ListResponse, tags=["Documents"])
async def list_documents():
    """Listar todos los documentos en ChromaDB"""
    try:
        logger.info("📋 Listando documentos...")

        # Obtener todos los recursos
        all_resources = app_state["resources_collection"].get()

        # Obtener conteo de chunks por resource_id
        all_chunks = app_state["embeddings_collection"].get()
        chunk_counts = {}
        for metadata in all_chunks["metadatas"]:
            resource_id = metadata.get("resource_id")
            if resource_id:
                chunk_counts[resource_id] = chunk_counts.get(resource_id, 0) + 1

        # Formatear documentos
        documents = []
        for i, resource_id in enumerate(all_resources["ids"]):
            metadata = all_resources["metadatas"][i]
            document = all_resources["documents"][i]

            documents.append(
                DocumentResponse(
                    id=resource_id,
                    title=metadata.get("title", "Untitled"),
                    author=metadata.get("author", "Unknown"),
                    type=metadata.get("type", "document"),
                    version=metadata.get("version", "1.0.0"),
                    source=metadata.get("source", "unknown"),
                    created_at=metadata.get("created_at", ""),
                    content_preview=document[:200] + "..."
                    if len(document) > 200
                    else document,
                    content_length=len(document),
                    chunks_count=chunk_counts.get(resource_id, 0),
                )
            )

        logger.info(f"✅ {len(documents)} documentos listados")

        return ListResponse(
            success=True,
            documents=documents,
            total_resources=len(documents),
            total_chunks=len(all_chunks["ids"]),
        )

    except Exception as e:
        logger.error(f"❌ Error listando documentos: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error listing documents: {str(e)}"
        )


@app.post("/api/search", response_model=SearchResponse, tags=["Search"])
async def hybrid_search_api(request: SearchRequest):
    """Realizar búsqueda híbrida con reranking"""
    try:
        logger.info(f"🔎 Búsqueda: '{request.query}' (k={request.k_final})")

        # Verificar que hay documentos
        if (
            not app_state["embeddings_collection"]
            or app_state["embeddings_collection"].count() == 0
        ):
            return SearchResponse(
                success=True,
                results=[],
                total_results=0,
                context="",
                query=request.query,
                message="No hay documentos en la base de datos.",
            )

        corpus_ids = app_state["embeddings_collection"].get()["ids"]

        # Asegurar que BM25 está listo
        if app_state["bm25_model"] is None:
            update_bm25_if_needed()

        # Búsqueda híbrida
        fused_results = hybrid_search(
            query=request.query,
            embeddings_collection=app_state["embeddings_collection"],
            bm25_searcher=app_state["bm25_model"],
            corpus_ids=corpus_ids,
            k_final=request.k_final,
            group_by_doc=request.group_by_doc,
        )

        # Reranking
        reranked_results = rerank(
            query=request.query,
            docs_ids_scores=fused_results,
            reranker_model=app_state["reranker_model"],
            reranker_tokenizer=app_state["reranker_tokenizer"],
            collection=app_state["embeddings_collection"],
            device=app_state["device"],
            min_sigmoid=request.min_sigmoid,
            max_per_doc=request.max_per_doc,
        )

        # Validar resultados
        validation = validate_mmr_results(
            reranked_results,
            app_state["embeddings_collection"],
            max_per_doc=request.max_per_doc,
        )
        logger.info(f"DEBUG: MMR validation: {validation}")

        # Formatear resultados
        results = []
        context_parts = []

        for doc_id, score in reranked_results:
            # Obtener documento y metadatos
            doc_data = app_state["embeddings_collection"].get(ids=[doc_id])
            content = doc_data["documents"][0]
            metadata = doc_data["metadatas"][0]

            # Calcular sigmoid score
            sigmoid_score = torch.sigmoid(torch.tensor(score)).item()

            # Obtener información del recurso padre
            resource_id = metadata.get("resource_id")
            resource_info = {}
            if resource_id:
                try:
                    resource_data = app_state["resources_collection"].get(
                        ids=[resource_id]
                    )
                    if resource_data["documents"]:
                        resource_metadata = resource_data["metadatas"][0]
                        resource_info = {
                            "title": resource_metadata.get("title", "Untitled"),
                            "author": resource_metadata.get("author", "Unknown"),
                            "source": resource_metadata.get("source", "unknown"),
                        }
                except Exception:
                    pass

            result = {
                "id": doc_id,
                "content": content,
                "score": {"logit": float(score), "sigmoid": float(sigmoid_score)},
                "metadata": {
                    "resource_id": resource_id,
                    "chunk_index": metadata.get("chunk_index", 0),
                    "length": metadata.get("length", len(content)),
                    **resource_info,
                },
            }

            results.append(result)

            # Crear contexto enriquecido con metadatos
            chunk_info = f"[Chunk ID: {doc_id[:8]}...] [Índice: {metadata.get('chunk_index', 'N/A')}]"
            if resource_info.get("title"):
                chunk_info += f" [Documento: {resource_info['title']}]"

            enriched_content = f"{chunk_info}\n{content}"
            context_parts.append(enriched_content)

        # Crear contexto combinado
        combined_context = "\n\n".join(context_parts)

        # 🔍 PRINT PARA DEBUG: Mostrar el contexto que se enviará al modelo
        print("\n" + "=" * 80)
        print("🔍 CONTEXTO QUE SE ENVIARÁ AL MODELO:")
        print("=" * 80)
        print(f"Query: {request.query}")
        print(f"Número de fragmentos: {len(context_parts)}")
        print(f"Longitud total del contexto: {len(combined_context)} caracteres")
        print("-" * 80)
        print("CONTEXTO COMPLETO:")
        print(combined_context)
        print("=" * 80)
        print()

        logger.info(f"✅ Búsqueda completada: {len(results)} resultados")

        return SearchResponse(
            success=True,
            results=results,
            total_results=len(results),
            context=combined_context,
            query=request.query,
            message="Búsqueda completada exitosamente",
        )

    except Exception as e:
        logger.error(f"❌ Error en búsqueda: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error performing search: {str(e)}"
        )


@app.delete("/api/delete", response_model=DeleteResponse, tags=["Documents"])
async def delete_document(request: DeleteRequest):
    """Borrar un documento y todos sus chunks de ChromaDB"""
    try:
        logger.info(f"🗑️ Borrando documento: {request.resource_id}")

        # Verificar que el documento existe
        try:
            resource_data = app_state["resources_collection"].get(
                ids=[request.resource_id]
            )
            if not resource_data["documents"]:
                raise HTTPException(
                    status_code=404, detail=f"Document {request.resource_id} not found"
                )
        except Exception:
            raise HTTPException(
                status_code=404, detail=f"Document {request.resource_id} not found"
            )

        # Obtener información del documento antes de borrarlo
        document_title = resource_data["metadatas"][0].get("title", "Unknown")

        # Obtener todos los chunks relacionados con este documento
        all_chunks = app_state["embeddings_collection"].get()
        chunks_to_delete = []

        for i, metadata in enumerate(all_chunks["metadatas"]):
            if metadata.get("resource_id") == request.resource_id:
                chunks_to_delete.append(all_chunks["ids"][i])

        logger.info(f"📊 Encontrados {len(chunks_to_delete)} chunks para borrar")

        # Borrar chunks de la colección embeddings
        if chunks_to_delete:
            app_state["embeddings_collection"].delete(ids=chunks_to_delete)
            logger.info(f"🗑️ Borrados {len(chunks_to_delete)} chunks")

        # Borrar el documento de la colección resources
        app_state["resources_collection"].delete(ids=[request.resource_id])
        logger.info(f"🗑️ Borrado documento principal: {request.resource_id}")

        # Actualizar BM25 después del borrado
        update_bm25_if_needed()

        logger.info(f"✅ Documento '{document_title}' borrado exitosamente")

        return DeleteResponse(
            success=True,
            resource_id=request.resource_id,
            chunks_deleted=len(chunks_to_delete),
            message=f"Successfully deleted document '{document_title}' and {len(chunks_to_delete)} chunks",
        )

    except HTTPException:
        # Re-raise HTTP exceptions (como 404)
        raise
    except Exception as e:
        logger.error(f"❌ Error borrando documento: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error deleting document: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(
        "main_server:app", host="0.0.0.0", port=8000, reload=True, log_level="info"
    )
