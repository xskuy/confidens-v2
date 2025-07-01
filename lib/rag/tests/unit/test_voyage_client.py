#!/usr/bin/env python3
"""
Pruebas comprehensivas para el sistema RAG
"""

import json
import os
import sys
from dataclasses import dataclass
from unittest.mock import Mock, mock_open, patch

import pytest

# Agregar el directorio padre al path para imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Imports de los módulos a probar
import prepare_chunks
from core.voyage_client import VoyageClient, VoyageClientError, batch_callback_progress, create_voyage_client


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


class TestVoyageClient:
    """Pruebas para VoyageClient"""

    @patch("core.voyage_client.voyageai")
    def test_init_success(self, mock_voyageai):
        """Test inicialización exitosa"""
        mock_voyageai.Client.return_value = MockVoyageAIClient()
        config = MockVoyageConfig()

        client = VoyageClient(config)

        assert client.config == config
        assert client.client is not None
        mock_voyageai.Client.assert_called_once_with(api_key=config.api_key)

    def test_init_no_voyageai(self):
        """Test inicialización sin voyageai instalado"""
        config = MockVoyageConfig()

        with patch("core.voyage_client.voyageai", None):
            with pytest.raises(ImportError, match="voyageai no está instalado"):
                VoyageClient(config)

    @patch("core.voyage_client.voyageai")
    def test_generate_embeddings_single_text(self, mock_voyageai):
        """Test generar embeddings para un solo texto"""
        mock_client = MockVoyageAIClient()
        mock_voyageai.Client.return_value = mock_client
        config = MockVoyageConfig()
        client = VoyageClient(config)

        result = client.generate_embeddings("test text")

        assert len(result) == 1
        assert len(result[0]) == config.embedding_dimension

    @patch("core.voyage_client.voyageai")
    def test_generate_embeddings_multiple_texts(self, mock_voyageai):
        """Test generar embeddings para múltiples textos"""
        mock_client = MockVoyageAIClient()
        mock_voyageai.Client.return_value = mock_client
        config = MockVoyageConfig()
        client = VoyageClient(config)

        texts = ["text1", "text2", "text3"]
        result = client.generate_embeddings(texts)

        assert len(result) == 3
        assert all(len(emb) == config.embedding_dimension for emb in result)

    @patch("core.voyage_client.voyageai")
    def test_generate_embeddings_empty_list(self, mock_voyageai):
        """Test error con lista vacía"""
        mock_voyageai.Client.return_value = MockVoyageAIClient()
        config = MockVoyageConfig()
        client = VoyageClient(config)

        with pytest.raises(ValueError, match="Se requiere al menos un texto"):
            client.generate_embeddings([])

    @patch("core.voyage_client.voyageai")
    def test_generate_embeddings_batch_processing(self, mock_voyageai):
        """Test procesamiento en lotes"""
        mock_client = MockVoyageAIClient()
        mock_voyageai.Client.return_value = mock_client
        config = MockVoyageConfig(batch_size=2)
        client = VoyageClient(config)

        texts = ["text1", "text2", "text3", "text4", "text5"]
        result = client.generate_embeddings(texts)

        assert len(result) == 5

    @patch("core.voyage_client.voyageai")
    def test_generate_embeddings_api_error(self, mock_voyageai):
        """Test manejo de errores de API"""
        mock_client = Mock()
        mock_client.embed.side_effect = Exception("API Error")
        mock_voyageai.Client.return_value = mock_client
        config = MockVoyageConfig()
        client = VoyageClient(config)

        with pytest.raises(VoyageClientError, match="Error generando embeddings"):
            client.generate_embeddings("test text")

    @patch("core.voyage_client.voyageai")
    def test_generate_document_embeddings(self, mock_voyageai):
        """Test generar embeddings de documentos"""
        mock_client = MockVoyageAIClient()
        mock_voyageai.Client.return_value = mock_client
        config = MockVoyageConfig()
        client = VoyageClient(config)

        result = client.generate_document_embeddings("test document")

        assert len(result) == 1
        assert len(result[0]) == config.embedding_dimension

    @patch("core.voyage_client.voyageai")
    def test_generate_query_embedding(self, mock_voyageai):
        """Test generar embedding de query"""
        mock_client = MockVoyageAIClient()
        mock_voyageai.Client.return_value = mock_client
        config = MockVoyageConfig()
        client = VoyageClient(config)

        result = client.generate_query_embedding("test query")

        assert len(result) == config.embedding_dimension

    @patch("core.voyage_client.voyageai")
    def test_batch_process_texts_with_callback(self, mock_voyageai):
        """Test procesamiento en lotes con callback"""
        mock_client = MockVoyageAIClient()
        mock_voyageai.Client.return_value = mock_client
        config = MockVoyageConfig(batch_size=2)
        client = VoyageClient(config)

        callback_calls = []

        def mock_callback(batch_num, total_batches, batch_size):
            callback_calls.append((batch_num, total_batches, batch_size))

        texts = ["text1", "text2", "text3"]
        result = client.batch_process_texts(texts, callback=mock_callback)

        assert len(result) == 3
        assert len(callback_calls) == 2  # 2 lotes

    @patch("core.voyage_client.voyageai")
    def test_batch_process_texts_with_error(self, mock_voyageai):
        """Test procesamiento en lotes con error en un lote"""
        mock_client = Mock()
        # Primer lote exitoso, segundo con error
        mock_client.embed.side_effect = [
            Mock(embeddings=[[0.1] * 1024, [0.1] * 1024], total_tokens=20),
            Exception("API Error"),
        ]
        mock_voyageai.Client.return_value = mock_client
        config = MockVoyageConfig(batch_size=2)
        client = VoyageClient(config)

        texts = ["text1", "text2", "text3", "text4"]
        result = client.batch_process_texts(texts)

        # Solo debe procesar el primer lote exitoso
        assert len(result) == 2

    @patch("core.voyage_client.voyageai")
    def test_get_model_info(self, mock_voyageai):
        """Test obtener información del modelo"""
        mock_voyageai.Client.return_value = MockVoyageAIClient()
        config = MockVoyageConfig()
        client = VoyageClient(config)

        info = client.get_model_info()

        assert info["model"] == config.model
        assert info["embedding_dimension"] == config.embedding_dimension
        assert info["batch_size"] == config.batch_size
        assert len(info["input_types"]) == 2

    @patch("core.voyage_client.voyageai")
    def test_validate_connection_success(self, mock_voyageai):
        """Test validación exitosa de conexión"""
        mock_client = Mock()
        mock_result = Mock()
        mock_result.embeddings = [[0.1] * 1024]  # Dimensión correcta
        mock_client.embed.return_value = mock_result
        mock_voyageai.Client.return_value = mock_client
        config = MockVoyageConfig()
        client = VoyageClient(config)

        result = client.validate_connection()

        assert result is True

    @patch("core.voyage_client.voyageai")
    def test_validate_connection_failure(self, mock_voyageai):
        """Test fallo en validación de conexión"""
        mock_client = Mock()
        mock_client.embed.side_effect = Exception("Connection Error")
        mock_voyageai.Client.return_value = mock_client
        config = MockVoyageConfig()
        client = VoyageClient(config)

        result = client.validate_connection()

        assert result is False

    @patch("core.voyage_client.voyageai")
    def test_validate_connection_wrong_dimension(self, mock_voyageai):
        """Test validación con dimensión incorrecta"""
        mock_client = Mock()
        mock_result = Mock()
        mock_result.embeddings = [[0.1] * 512]  # Dimensión incorrecta
        mock_client.embed.return_value = mock_result
        mock_voyageai.Client.return_value = mock_client
        config = MockVoyageConfig(embedding_dimension=1024)
        client = VoyageClient(config)

        result = client.validate_connection()

        assert result is False


class TestVoyageClientUtilities:
    """Pruebas para funciones utilitarias"""

    @patch("core.voyage_client.voyageai")
    def test_create_voyage_client(self, mock_voyageai):
        """Test crear cliente con función helper"""
        mock_voyageai.Client.return_value = MockVoyageAIClient()

        client = create_voyage_client("test_key", "voyage-3.5")

        assert isinstance(client, VoyageClient)
        assert client.config.api_key == "test_key"
        assert client.config.model == "voyage-3.5"

    def test_batch_callback_progress(self):
        """Test función de callback de progreso"""
        # Esta función solo imprime, no retorna nada
        # Solo verificamos que no lance excepciones
        batch_callback_progress(1, 5, 10)
        batch_callback_progress(5, 5, 2)


class TestPrepareChunks:
    """Pruebas para prepare_chunks.py"""

    def test_load_jsonl(self):
        """Test cargar archivo JSONL"""
        test_data = [{"type": "text", "text": "Test 1"}, {"type": "heading", "text": "Title 1"}]

        with patch("builtins.open", mock_open(read_data="\n".join(json.dumps(item) for item in test_data))):
            result = prepare_chunks.load_jsonl("test.jsonl")

        assert len(result) == 2
        assert result[0]["text"] == "Test 1"
        assert result[1]["text"] == "Title 1"

    def test_build_title_map(self):
        """Test construir mapa de títulos"""
        blocks = [
            {"type": "heading", "section_path": "1", "text": "Title 1"},
            {"type": "text", "text": "Content 1"},
            {"type": "heading", "section_path": "2", "text": "Title 2"},
        ]

        result = prepare_chunks.build_title_map(blocks)

        assert len(result) == 2
        assert result["1"] == "Title 1"
        assert result["2"] == "Title 2"

    def test_enrich_text_blocks(self):
        """Test enriquecer bloques de texto"""
        blocks = [
            {"type": "text", "text": "Content 1", "parent": "1"},
            {"type": "heading", "text": "Title 1", "section_path": "1"},
            {"type": "image", "ocr": "Image text"},
        ]
        title_map = {"1": "Title 1"}

        result = prepare_chunks.enrich_text_blocks(blocks, title_map)

        assert len(result) == 3
        assert "enriched_text" in result[0]
        assert "Sección: Title 1" in result[0]["enriched_text"]
        assert "original_text" in result[0]
        assert result[1]["enriched_text"] == "Title 1"
        assert "Imagen (OCR)" in result[2]["enriched_text"]

    def test_save_enriched_jsonl(self):
        """Test guardar archivo JSONL enriquecido"""
        blocks = [{"type": "text", "enriched_text": "Test content"}]

        with patch("builtins.open", mock_open()) as mock_file:
            prepare_chunks.save_enriched_jsonl(blocks, "output.jsonl")

        mock_file.assert_called_once_with("output.jsonl", "w", encoding="utf-8")
        handle = mock_file()
        handle.write.assert_called()

    def test_print_sample_chunks(self, capsys):
        """Test mostrar chunks de ejemplo"""
        blocks = [
            {"type": "text", "enriched_text": "Test content 1", "page": 1, "block_id": "b1", "parent": "p1"},
            {"type": "text", "enriched_text": "Test content 2", "page": 2, "block_id": "b2", "parent": "p2"},
        ]

        prepare_chunks.print_sample_chunks(blocks, num_samples=1)

        captured = capsys.readouterr()
        assert "Ejemplos de Chunks Enriquecidos" in captured.out
        assert "Test content 1" in captured.out
