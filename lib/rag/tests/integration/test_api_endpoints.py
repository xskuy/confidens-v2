#!/usr/bin/env python3
"""
Tests de integración para los endpoints de la API de RAG.
"""

import io
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from lib.rag.api.dependencies import get_rag_system
from lib.rag.api.main import app
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


@pytest.fixture
def mock_rag_system():
    """Fixture para mockear el RAGSystem."""
    mock = MagicMock()
    mock.search.return_value = [{"id": "search-1", "score": 0.9, "text": "Resultado de búsqueda", "metadata": {}}]
    mock.list_documents.return_value = (
        [{"id": "doc-1", "payload": {"file_name": "test.pdf"}}],
        None,
    )
    mock.process_document_chunks.return_value = True
    mock.delete_documents_by_metadata.return_value = True
    mock.get_system_info.return_value = {
        "status": "active",
        "voyage": {"model": "mock_model"},
        "qdrant": {"status": "ok"},
    }
    return mock


@pytest.fixture
def client(mock_rag_system):
    """Fixture para el TestClient de FastAPI con dependencias mockeadas."""
    app.dependency_overrides[get_rag_system] = lambda: mock_rag_system
    with TestClient(app) as c:
        yield c
    app.dependency_overrides = {}


@pytest.fixture
def dummy_pdf_bytes():
    """Crea un archivo PDF falso en memoria para las pruebas."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.drawString(100, 750, "Este es un PDF de prueba para la API de RAG.")
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer


def test_health_check(client: TestClient):
    """Verifica que el endpoint de health check funciona."""
    response = client.get("/api/rag/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"
    assert data["qdrant"]["status"] == "ok"


def test_upload_document(client: TestClient, dummy_pdf_bytes: io.BytesIO):
    """Verifica la subida de un documento."""
    files = {"file": ("test.pdf", dummy_pdf_bytes, "application/pdf")}
    # Mockeamos el pipeline de orquestación para no depender de su lógica interna
    with patch("lib.rag.api.router.run_full_pipeline_from_bytes") as mock_pipeline:
        mock_pipeline.return_value = ("fake-doc-id", [{"text": "chunk1"}])

        response = client.post("/api/rag/documents/upload", files=files)

        assert response.status_code == 201
        data = response.json()
        assert data["document_id"] == "fake-doc-id"
        assert data["file_name"] == "test.pdf"
        assert data["chunks_processed"] > 0
        mock_pipeline.assert_called_once()


def test_search_endpoint(client: TestClient):
    """Verifica el endpoint de búsqueda."""
    query = {"query": "dame información de prueba"}
    response = client.post("/api/rag/search", json=query)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["id"] == "search-1"


def test_list_documents_endpoint(client: TestClient):
    """Verifica el endpoint de listado de documentos."""
    response = client.get("/api/rag/documents")
    assert response.status_code == 200
    data = response.json()
    assert len(data["documents"]) > 0
    assert data["documents"][0]["id"] == "doc-1"


def test_delete_document_endpoint(client: TestClient, mock_rag_system: MagicMock):
    """Verifica el endpoint de eliminación de documentos."""
    doc_id = "test-doc-to-delete"
    response = client.delete(f"/api/rag/documents/{doc_id}")

    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verifica que se llamó al método correcto del mock
    mock_rag_system.delete_documents_by_metadata.assert_called_once_with(filter_conditions={"document_id": doc_id})
