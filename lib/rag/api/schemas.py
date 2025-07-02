#!/usr/bin/env python3
"""
Esquemas Pydantic para la API de RAG (validación de datos)
"""

from typing import Any, Optional

from pydantic import BaseModel, Field


class SearchQuery(BaseModel):
    """Cuerpo para una petición de búsqueda"""

    query: str = Field(..., description="Texto de la consulta")
    limit: int = Field(10, description="Número máximo de resultados")
    score_threshold: Optional[float] = Field(None, description="Umbral de puntuación mínimo para los resultados")
    filter_conditions: Optional[dict[str, Any]] = Field(None, description="Filtros a aplicar en la búsqueda")


class SearchResult(BaseModel):
    """Resultado de una búsqueda"""

    id: str
    score: float
    text: str
    metadata: dict[str, Any]


class DocumentDetails(BaseModel):
    """Detalles de un documento en la base de datos"""

    id: str
    payload: dict[str, Any]


class ListDocumentsResponse(BaseModel):
    """Respuesta para el listado de documentos"""

    documents: list[DocumentDetails]
    next_offset: Optional[Any] = None


class DeleteResponse(BaseModel):
    """Respuesta genérica para operaciones de borrado"""

    success: bool
    message: str


class HealthResponse(BaseModel):
    """Respuesta del endpoint de salud del sistema"""

    status: str
    voyage: Optional[Any] = None
    qdrant: Optional[Any] = None
    error: Optional[str] = None
