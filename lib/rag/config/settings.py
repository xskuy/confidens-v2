#!/usr/bin/env python3
"""
Configuración centralizada del sistema RAG
"""

import os
from dataclasses import dataclass


@dataclass
class VoyageConfig:
    """Configuración para Voyage AI"""

    api_key: str
    model: str = "voyage-3.5"
    embedding_dimension: int = 1024
    batch_size: int = 50
    input_type_document: str = "document"
    input_type_query: str = "query"

    def __post_init__(self):
        if not self.api_key:
            raise ValueError("VOYAGE_API_KEY es requerido")


@dataclass
class QdrantConfig:
    """Configuración para Qdrant"""

    url: str = "http://localhost:6333"
    collection_name: str = "documents"
    vector_size: int = 1024
    distance_metric: str = "COSINE"
    recreate_collection: bool = False


@dataclass
class ProcessingConfig:
    """Configuración para procesamiento de documentos"""

    min_chunk_length: int = 20
    batch_size: int = 50
    temp_dir: str = "temp_processing"
    cleanup_temp_files: bool = True
    use_gpu_ocr: bool = False


@dataclass
class RAGConfig:
    """Configuración completa del sistema RAG"""

    voyage: VoyageConfig
    qdrant: QdrantConfig
    processing: ProcessingConfig

    @classmethod
    def from_env(cls) -> "RAGConfig":
        """Crear configuración desde variables de entorno"""
        voyage_config = VoyageConfig(
            api_key=os.getenv("VOYAGE_API_KEY", ""),
            model=os.getenv("VOYAGE_MODEL", "voyage-3.5"),
            batch_size=int(os.getenv("VOYAGE_BATCH_SIZE", "50")),
        )

        qdrant_config = QdrantConfig(
            url=os.getenv("QDRANT_URL", "http://localhost:6333"),
            collection_name=os.getenv("QDRANT_COLLECTION", "documents"),
            recreate_collection=os.getenv("QDRANT_RECREATE", "false").lower() == "true",
        )

        processing_config = ProcessingConfig(
            min_chunk_length=int(os.getenv("MIN_CHUNK_LENGTH", "20")),
            batch_size=int(os.getenv("PROCESSING_BATCH_SIZE", "50")),
            temp_dir=os.getenv("TEMP_DIR", "temp_processing"),
            cleanup_temp_files=os.getenv("CLEANUP_TEMP", "true").lower() == "true",
            use_gpu_ocr=os.getenv("USE_GPU_OCR", "false").lower() == "true",
        )

        return cls(
            voyage=voyage_config, qdrant=qdrant_config, processing=processing_config
        )

    @classmethod
    def default(cls) -> "RAGConfig":
        """Configuración por defecto para testing"""
        return cls(
            voyage=VoyageConfig(api_key="test_key"),
            qdrant=QdrantConfig(),
            processing=ProcessingConfig(),
        )
