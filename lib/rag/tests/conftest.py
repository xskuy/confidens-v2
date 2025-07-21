#!/usr/bin/env python3
"""
Fixtures compartidas para las pruebas del sistema RAG
"""

import os
import sys
from dataclasses import dataclass
from unittest.mock import Mock

import pytest

# Agregar el directorio padre al path para imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import ProcessingConfig, QdrantConfig, RAGConfig, VoyageConfig


@dataclass
class MockVoyageConfig:
    """Configuración mock para pruebas"""

    api_key: str = "test_key"
    model: str = "voyage-3.5"
    embedding_dimension: int = 1024
    batch_size: int = 50
    input_type_document: str = "document"
    input_type_query: str = "query"


class MockVoyageAIClient:
    """Mock del cliente de Voyage AI"""

    def embed(self, texts, model, input_type, output_dimension=None, truncation=None):
        """Mock del método embed"""
        mock_result = Mock()
        mock_result.embeddings = [[0.1] * output_dimension for _ in texts]
        mock_result.total_tokens = len(texts) * 10
        return mock_result


@pytest.fixture
def mock_voyage_config():
    """Fixture para configuración mock de Voyage"""
    return MockVoyageConfig()


@pytest.fixture
def mock_voyage_client():
    """Fixture para cliente mock de Voyage AI"""
    return MockVoyageAIClient()


@pytest.fixture
def sample_jsonl_data():
    """Fixture con datos de ejemplo para pruebas JSONL"""
    return [
        {"type": "text", "text": "Sample text content", "parent": "1"},
        {"type": "heading", "section_path": "1", "text": "Sample Title"},
        {"type": "image", "ocr": "Image text content"},
    ]


@pytest.fixture
def sample_title_map():
    """Fixture con mapa de títulos de ejemplo"""
    return {"1": "Main Title", "2": "Subtitle", "3": "Section Title"}


@pytest.fixture
def voyage_config():
    """Fixture para configuración real de Voyage"""
    return VoyageConfig(api_key="test_key")


@pytest.fixture
def qdrant_config():
    """Fixture para configuración de Qdrant"""
    return QdrantConfig()


@pytest.fixture
def processing_config():
    """Fixture para configuración de procesamiento"""
    return ProcessingConfig()


@pytest.fixture
def rag_config(voyage_config, qdrant_config, processing_config):
    """Fixture para configuración completa de RAG"""
    return RAGConfig(voyage=voyage_config, qdrant=qdrant_config, processing=processing_config)
