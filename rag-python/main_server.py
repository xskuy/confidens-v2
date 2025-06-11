#!/usr/bin/env python3
"""
Servidor FastAPI para las APIs de RAG con Chroma.
Mantiene los modelos en memoria para máximo rendimiento.
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import List, Optional

import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from bm25_search import create_bm25_searcher
from db import get_db_client, get_or_create_collections
from hybrid_search import hybrid_search, rerank
from ingest import ingest_resource

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
    k_final: Optional[int] = 10
    min_sigmoid: Optional[float] = 0.5
    max_per_doc: Optional[int] = 3
    group_by_doc: Optional[bool] = False

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
            logger.info("⚠️  No hay documentos para BM25, se inicializará con el primer documento")

        # Cargar modelo de reranking
        logger.info("🤖 Cargando modelo de reranking...")
        RERANKER_MODEL_NAME = "BAAI/bge-reranker-large"
        app_state["device"] = "cpu"  # Cambiar a "cuda" si tienes GPU

        app_state["reranker_tokenizer"] = AutoTokenizer.from_pretrained(RERANKER_MODEL_NAME)
        app_state["reranker_model"] = AutoModelForSequenceClassification.from_pretrained(
            RERANKER_MODEL_NAME
        ).to(app_state["device"])

        # Configurar pad_token si es necesario
        if app_state["reranker_tokenizer"].pad_token is None:
            app_state["reranker_tokenizer"].pad_token = app_state["reranker_tokenizer"].eos_token
            app_state["reranker_tokenizer"].pad_token_id = app_state["reranker_tokenizer"].eos_token_id
            app_state["reranker_model"].resize_token_embeddings(len(app_state["reranker_tokenizer"]))

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
    lifespan=lifespan
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
            logger.info(f"🔄 BM25 actualizado con {len(all_docs['documents'])} documentos")
    except Exception as e:
        logger.error(f"❌ Error actualizando BM25: {e}")


@app.get("/", tags=["Health"])
async def root():
    """Endpoint de salud del servidor"""
    return {
        "message": "🚀 RAG API Server running!",
        "status": "healthy",
        "endpoints": ["/docs", "/ingest", "/list", "/search", "/delete"]
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
            message=f"Successfully ingested document '{request.title}'"
        )
        
    except Exception as e:
        logger.error(f"❌ Error en ingesta: {e}")
        raise HTTPException(status_code=500, detail=f"Error ingesting document: {str(e)}")


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
            
            documents.append(DocumentResponse(
                id=resource_id,
                title=metadata.get("title", "Untitled"),
                author=metadata.get("author", "Unknown"),
                type=metadata.get("type", "document"),
                version=metadata.get("version", "1.0.0"),
                source=metadata.get("source", "unknown"),
                created_at=metadata.get("created_at", ""),
                content_preview=document[:200] + "..." if len(document) > 200 else document,
                content_length=len(document),
                chunks_count=chunk_counts.get(resource_id, 0),
            ))
        
        logger.info(f"✅ {len(documents)} documentos listados")
        
        return ListResponse(
            success=True,
            documents=documents,
            total_resources=len(documents),
            total_chunks=len(all_chunks["ids"])
        )
        
    except Exception as e:
        logger.error(f"❌ Error listando documentos: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing documents: {str(e)}")


@app.post("/api/search", response_model=SearchResponse, tags=["Search"])
async def hybrid_search_api(request: SearchRequest):
    """Realizar búsqueda híbrida con reranking"""
    try:
        logger.info(f"🔎 Búsqueda: '{request.query}' (k={request.k_final})")
        
        # Verificar que hay documentos
        all_docs = app_state["embeddings_collection"].get()
        if not all_docs["documents"]:
            return SearchResponse(
                success=True,
                results=[],
                total_results=0,
                context="",
                query=request.query
            )
        
        corpus_ids = all_docs["ids"]
        
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
                    resource_data = app_state["resources_collection"].get(ids=[resource_id])
                    if resource_data["documents"]:
                        resource_metadata = resource_data["metadatas"][0]
                        resource_info = {
                            "title": resource_metadata.get("title", "Untitled"),
                            "author": resource_metadata.get("author", "Unknown"),
                            "source": resource_metadata.get("source", "unknown"),
                        }
                except Exception:
                    pass
            
            result = SearchResultResponse(
                id=doc_id,
                content=content,
                score={
                    "logit": float(score),
                    "sigmoid": float(sigmoid_score)
                },
                metadata={
                    "resource_id": resource_id,
                    "chunk_index": metadata.get("chunk_index", 0),
                    "length": metadata.get("length", len(content)),
                    **resource_info
                }
            )
            
            results.append(result)
            context_parts.append(content)
        
        # Crear contexto combinado
        combined_context = "\n\n".join(context_parts)
        
        logger.info(f"✅ Búsqueda completada: {len(results)} resultados")
        
        return SearchResponse(
            success=True,
            results=results,
            total_results=len(results),
            context=combined_context,
            query=request.query
        )
        
    except Exception as e:
        logger.error(f"❌ Error en búsqueda: {e}")
        raise HTTPException(status_code=500, detail=f"Error performing search: {str(e)}")


@app.delete("/api/delete", response_model=DeleteResponse, tags=["Documents"])
async def delete_document(request: DeleteRequest):
    """Borrar un documento y todos sus chunks de ChromaDB"""
    try:
        logger.info(f"🗑️ Borrando documento: {request.resource_id}")
        
        # Verificar que el documento existe
        try:
            resource_data = app_state["resources_collection"].get(ids=[request.resource_id])
            if not resource_data["documents"]:
                raise HTTPException(status_code=404, detail=f"Document {request.resource_id} not found")
        except Exception:
            raise HTTPException(status_code=404, detail=f"Document {request.resource_id} not found")
        
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
            message=f"Successfully deleted document '{document_title}' and {len(chunks_to_delete)} chunks"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (como 404)
        raise
    except Exception as e:
        logger.error(f"❌ Error borrando documento: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        "main_server:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    ) 