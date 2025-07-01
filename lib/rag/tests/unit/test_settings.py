#!/usr/bin/env python3
"""
Pruebas completas para config/settings.py
"""

import os
import sys
from unittest.mock import patch

import pytest

# Agregar el directorio padre al path para imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from config.settings import ProcessingConfig, QdrantConfig, RAGConfig, VoyageConfig


class TestVoyageConfig:
    """Pruebas para VoyageConfig"""

    def test_voyage_config_valid(self):
        """Test configuración válida de Voyage"""
        config = VoyageConfig(api_key="test_key")

        assert config.api_key == "test_key"
        assert config.model == "voyage-3.5"
        assert config.embedding_dimension == 1024
        assert config.batch_size == 50
        assert config.input_type_document == "document"
        assert config.input_type_query == "query"

    def test_voyage_config_custom_values(self):
        """Test configuración con valores personalizados"""
        config = VoyageConfig(
            api_key="custom_key",
            model="voyage-large",
            embedding_dimension=2048,
            batch_size=100,
            input_type_document="doc",
            input_type_query="search",
        )

        assert config.api_key == "custom_key"
        assert config.model == "voyage-large"
        assert config.embedding_dimension == 2048
        assert config.batch_size == 100
        assert config.input_type_document == "doc"
        assert config.input_type_query == "search"

    def test_voyage_config_empty_api_key(self):
        """Test error con API key vacía"""
        with pytest.raises(ValueError, match="VOYAGE_API_KEY es requerido"):
            VoyageConfig(api_key="")

    def test_voyage_config_none_api_key(self):
        """Test error con API key None"""
        with pytest.raises(ValueError, match="VOYAGE_API_KEY es requerido"):
            VoyageConfig(api_key=None)


class TestQdrantConfig:
    """Pruebas para QdrantConfig"""

    def test_qdrant_config_defaults(self):
        """Test configuración por defecto de Qdrant"""
        config = QdrantConfig()

        assert config.url == "http://localhost:6333"
        assert config.collection_name == "documents"
        assert config.vector_size == 1024
        assert config.distance_metric == "COSINE"
        assert config.recreate_collection is False

    def test_qdrant_config_custom_values(self):
        """Test configuración personalizada de Qdrant"""
        config = QdrantConfig(
            url="http://remote:6333",
            collection_name="custom_docs",
            vector_size=512,
            distance_metric="EUCLIDEAN",
            recreate_collection=True,
        )

        assert config.url == "http://remote:6333"
        assert config.collection_name == "custom_docs"
        assert config.vector_size == 512
        assert config.distance_metric == "EUCLIDEAN"
        assert config.recreate_collection is True


class TestProcessingConfig:
    """Pruebas para ProcessingConfig"""

    def test_processing_config_defaults(self):
        """Test configuración por defecto de Processing"""
        config = ProcessingConfig()

        assert config.min_chunk_length == 20
        assert config.batch_size == 50
        assert config.temp_dir == "temp_processing"
        assert config.cleanup_temp_files is True
        assert config.use_gpu_ocr is False

    def test_processing_config_custom_values(self):
        """Test configuración personalizada de Processing"""
        config = ProcessingConfig(
            min_chunk_length=100, batch_size=25, temp_dir="/custom/temp", cleanup_temp_files=False, use_gpu_ocr=True
        )

        assert config.min_chunk_length == 100
        assert config.batch_size == 25
        assert config.temp_dir == "/custom/temp"
        assert config.cleanup_temp_files is False
        assert config.use_gpu_ocr is True


class TestRAGConfig:
    """Pruebas para RAGConfig"""

    def test_rag_config_creation(self):
        """Test crear configuración RAG completa"""
        voyage_config = VoyageConfig(api_key="test_key")
        qdrant_config = QdrantConfig()
        processing_config = ProcessingConfig()

        rag_config = RAGConfig(voyage=voyage_config, qdrant=qdrant_config, processing=processing_config)

        assert rag_config.voyage == voyage_config
        assert rag_config.qdrant == qdrant_config
        assert rag_config.processing == processing_config

    def test_rag_config_default(self):
        """Test configuración por defecto de RAG"""
        config = RAGConfig.default()

        assert config.voyage.api_key == "test_key"
        assert config.qdrant.url == "http://localhost:6333"
        assert config.processing.min_chunk_length == 20

    @patch.dict(
        os.environ,
        {
            "VOYAGE_API_KEY": "env_key",
            "VOYAGE_MODEL": "voyage-large",
            "VOYAGE_BATCH_SIZE": "100",
            "QDRANT_URL": "http://custom:6333",
            "QDRANT_COLLECTION": "custom_collection",
            "QDRANT_RECREATE": "true",
            "MIN_CHUNK_LENGTH": "50",
            "PROCESSING_BATCH_SIZE": "75",
            "TEMP_DIR": "/custom/temp",
            "CLEANUP_TEMP": "false",
            "USE_GPU_OCR": "true",
        },
    )
    def test_rag_config_from_env(self):
        """Test crear configuración desde variables de entorno"""
        config = RAGConfig.from_env()

        # Verificar configuración Voyage
        assert config.voyage.api_key == "env_key"
        assert config.voyage.model == "voyage-large"
        assert config.voyage.batch_size == 100

        # Verificar configuración Qdrant
        assert config.qdrant.url == "http://custom:6333"
        assert config.qdrant.collection_name == "custom_collection"
        assert config.qdrant.recreate_collection is True

        # Verificar configuración Processing
        assert config.processing.min_chunk_length == 50
        assert config.processing.batch_size == 75
        assert config.processing.temp_dir == "/custom/temp"
        assert config.processing.cleanup_temp_files is False
        assert config.processing.use_gpu_ocr is True

    @patch.dict(
        os.environ,
        {
            "VOYAGE_API_KEY": "test_key",
            "USE_GPU_OCR": "TRUE",  # Mayúsculas
            "CLEANUP_TEMP": "True",  # Capitalizado
        },
    )
    def test_rag_config_from_env_boolean_case_insensitive(self):
        """Test que los booleans sean case-insensitive"""
        config = RAGConfig.from_env()

        assert config.processing.use_gpu_ocr is True
        assert config.processing.cleanup_temp_files is True

    @patch.dict(os.environ, {"VOYAGE_API_KEY": "test_key"}, clear=True)
    def test_rag_config_from_env_defaults(self):
        """Test configuración desde env con valores por defecto"""
        config = RAGConfig.from_env()

        # Verificar valores por defecto (con API key válida)
        assert config.voyage.api_key == "test_key"
        assert config.voyage.model == "voyage-3.5"
        assert config.voyage.batch_size == 50
        assert config.qdrant.url == "http://localhost:6333"
        assert config.qdrant.collection_name == "documents"
        assert config.qdrant.recreate_collection is False
        assert config.processing.min_chunk_length == 20
        assert config.processing.batch_size == 50
        assert config.processing.temp_dir == "temp_processing"
        assert config.processing.cleanup_temp_files is True
        assert config.processing.use_gpu_ocr is False

    @patch.dict(
        os.environ,
        {
            "VOYAGE_BATCH_SIZE": "invalid",
        },
    )
    def test_rag_config_from_env_invalid_int(self):
        """Test error con valor entero inválido"""
        with pytest.raises(ValueError):
            RAGConfig.from_env()

    @patch.dict(
        os.environ,
        {
            "VOYAGE_API_KEY": "test_key",
            "QDRANT_RECREATE": "maybe",  # Valor inválido para boolean
        },
    )
    def test_rag_config_from_env_invalid_boolean(self):
        """Test valor boolean inválido (debe usar False por defecto)"""
        config = RAGConfig.from_env()
        # "maybe" != "true", entonces debe ser False
        assert config.qdrant.recreate_collection is False


class TestConfigIntegration:
    """Pruebas de integración de configuraciones"""

    def test_voyage_config_in_rag_from_env_invalid_key(self):
        """Test que RAGConfig.from_env falle con key vacía"""
        # Esto debe fallar porque __post_init__ valida la key
        with patch.dict(os.environ, {"VOYAGE_API_KEY": ""}, clear=True):
            with pytest.raises(ValueError, match="VOYAGE_API_KEY es requerido"):
                RAGConfig.from_env()

    def test_all_configs_compatibility(self):
        """Test que todas las configuraciones sean compatibles entre sí"""
        voyage_config = VoyageConfig(api_key="test_key", embedding_dimension=512)
        qdrant_config = QdrantConfig(vector_size=512)  # Mismo tamaño que embedding
        processing_config = ProcessingConfig()

        rag_config = RAGConfig(voyage=voyage_config, qdrant=qdrant_config, processing=processing_config)

        # Verificar compatibilidad de dimensiones
        assert rag_config.voyage.embedding_dimension == rag_config.qdrant.vector_size
