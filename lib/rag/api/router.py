#!/usr/bin/env python3
"""
Rutas de la API para el sistema RAG
"""

import logging

from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile

from ..core.rag_system import RAGSystem
from ..orchestration import run_full_pipeline_from_bytes
from .dependencies import get_rag_system
from .schemas import DeleteResponse, HealthResponse, ListDocumentsResponse, SearchQuery, SearchResult

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check(rag_system: RAGSystem = Depends(get_rag_system)):
    """Verifica el estado del sistema RAG y sus componentes."""
    try:
        info = rag_system.get_system_info()
        return HealthResponse(**info)
    except Exception as e:
        logger.error(f"Error en health check: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {e}")


@router.post("/search", response_model=list[SearchResult])
def search(
    query: SearchQuery = Body(...),
    rag_system: RAGSystem = Depends(get_rag_system),
):
    """Busca en los documentos utilizando una consulta."""
    try:
        results = rag_system.search(
            query=query.query,
            limit=query.limit,
            score_threshold=query.score_threshold,
            filter_conditions=query.filter_conditions,
        )
        return results
    except Exception as e:
        logger.error(f"Error en búsqueda: {e}")
        raise HTTPException(status_code=500, detail="Error al procesar la búsqueda.")


@router.get("/documents", response_model=ListDocumentsResponse)
def list_documents(
    page: int = 1,
    limit: int = 10,
    rag_system: RAGSystem = Depends(get_rag_system),
):
    """Lista los documentos procesados con paginación."""
    try:
        all_documents = rag_system.list_documents()
        total_documents = len(all_documents)

        # Implementar paginación manualmente
        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_documents = all_documents[start_index:end_index]

        return {
            "documents": paginated_documents,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_documents": total_documents,
                "total_pages": (total_documents + limit - 1) // limit,
            },
        }
    except Exception as e:
        logger.error(f"Error listando documentos: {e}")
        raise HTTPException(status_code=500, detail="Error al listar documentos.")


@router.post("/documents/upload", status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    rag_system: RAGSystem = Depends(get_rag_system),
):
    """Sube un documento (PDF) para ser procesado e indexado."""
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Solo se admiten archivos PDF.")

    try:
        file_bytes = await file.read()

        # Ejecutar el pipeline completo de procesamiento
        document_id, chunks = run_full_pipeline_from_bytes(file_bytes, file.filename)

        if not chunks:
            raise HTTPException(status_code=400, detail="No se pudo extraer contenido del PDF.")

        # Procesar los chunks con el sistema RAG
        success = rag_system.process_document_chunks(chunks=chunks, document_id=document_id)

        if not success:
            raise HTTPException(status_code=500, detail="Error al procesar los chunks del documento.")

        return {"document_id": document_id, "file_name": file.filename, "chunks_processed": len(chunks)}

    except Exception as e:
        logger.error(f"Error subiendo documento: {e}")
        raise HTTPException(status_code=500, detail=f"Error al subir el archivo: {e}")


@router.delete("/documents/{document_id}", response_model=DeleteResponse)
def delete_document(
    document_id: str,
    rag_system: RAGSystem = Depends(get_rag_system),
):
    """Elimina todos los chunks asociados a un `document_id`."""
    try:
        success = rag_system.delete_documents_by_metadata(filter_conditions={"document_id": document_id})
        if success:
            return {"success": True, "message": f"Documento {document_id} eliminado."}
        else:
            raise HTTPException(status_code=404, detail="El documento no se encontró o no pudo ser eliminado.")
    except Exception as e:
        logger.error(f"Error eliminando documento {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Error interno al eliminar documento.")
