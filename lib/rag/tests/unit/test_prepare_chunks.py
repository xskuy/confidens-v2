#!/usr/bin/env python3
"""
Pruebas unitarias para prepare_chunks.py
"""

import json
import os
import sys
from unittest.mock import mock_open, patch

import pytest

# Agregar el directorio padre al path para imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import prepare_chunks


class TestLoadJsonl:
    """Pruebas para load_jsonl"""

    def test_load_jsonl_success(self):
        """Test cargar archivo JSONL exitosamente"""
        test_data = [{"type": "text", "text": "Test 1"}, {"type": "heading", "text": "Title 1"}]

        with patch("builtins.open", mock_open(read_data="\n".join(json.dumps(item) for item in test_data))):
            result = prepare_chunks.load_jsonl("test.jsonl")

        assert len(result) == 2
        assert result[0]["text"] == "Test 1"
        assert result[1]["text"] == "Title 1"

    def test_load_jsonl_empty_lines(self):
        """Test cargar JSONL con líneas vacías"""
        test_data = """{"type": "text", "text": "Test 1"}

{"type": "heading", "text": "Title 1"}
"""

        with patch("builtins.open", mock_open(read_data=test_data)):
            result = prepare_chunks.load_jsonl("test.jsonl")

        assert len(result) == 2
        assert result[0]["text"] == "Test 1"
        assert result[1]["text"] == "Title 1"

    def test_load_jsonl_invalid_json(self):
        """Test cargar JSONL con JSON inválido"""
        test_data = """{"type": "text", "text": "Test 1"}
invalid json line
{"type": "heading", "text": "Title 1"}"""

        with patch("builtins.open", mock_open(read_data=test_data)):
            with pytest.raises(json.JSONDecodeError):
                prepare_chunks.load_jsonl("test.jsonl")


class TestBuildTitleMap:
    """Pruebas para build_title_map"""

    def test_build_title_map_success(self):
        """Test construir mapa de títulos exitosamente"""
        blocks = [
            {"type": "heading", "section_path": "1", "text": "Title 1"},
            {"type": "text", "text": "Content 1"},
            {"type": "heading", "section_path": "2", "text": "Title 2"},
        ]

        result = prepare_chunks.build_title_map(blocks)

        assert len(result) == 2
        assert result["1"] == "Title 1"
        assert result["2"] == "Title 2"

    def test_build_title_map_empty_blocks(self):
        """Test construir mapa de títulos con lista vacía"""
        result = prepare_chunks.build_title_map([])
        assert result == {}

    def test_build_title_map_no_headings(self):
        """Test construir mapa de títulos sin headings"""
        blocks = [
            {"type": "text", "text": "Content 1"},
            {"type": "image", "ocr": "Image text"},
        ]

        result = prepare_chunks.build_title_map(blocks)
        assert result == {}

    def test_build_title_map_missing_fields(self):
        """Test construir mapa de títulos con campos faltantes"""
        blocks = [
            {"type": "heading", "text": "Title 1"},  # Falta section_path
            {"type": "heading", "section_path": "2"},  # Falta text
            {"type": "heading", "section_path": "3", "text": ""},  # Text vacío
            {"type": "heading", "section_path": "4", "text": "Valid Title"},  # Válido
        ]

        result = prepare_chunks.build_title_map(blocks)
        assert len(result) == 1
        assert result["4"] == "Valid Title"


class TestEnrichTextBlocks:
    """Pruebas para enrich_text_blocks"""

    def test_enrich_text_blocks_with_parent(self):
        """Test enriquecer bloques de texto con parent"""
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

    def test_enrich_text_blocks_no_parent(self):
        """Test enriquecer bloques sin parent"""
        blocks = [
            {"type": "text", "text": "Content without parent"},
        ]
        title_map = {}

        result = prepare_chunks.enrich_text_blocks(blocks, title_map)

        assert len(result) == 1
        # Los bloques sin parent no se enriquecen automáticamente
        assert "enriched_text" not in result[0]

    def test_enrich_text_blocks_empty_text(self):
        """Test enriquecer bloques con texto vacío"""
        blocks = [
            {"type": "text", "text": "", "parent": "1"},
            {"type": "text", "text": "   ", "parent": "2"},
        ]
        title_map = {"1": "Title 1", "2": "Title 2"}

        result = prepare_chunks.enrich_text_blocks(blocks, title_map)

        # Los bloques con texto vacío no deben ser enriquecidos
        assert len(result) == 2
        assert "enriched_text" not in result[0]
        assert "enriched_text" not in result[1]

    def test_enrich_text_blocks_heading_only(self):
        """Test enriquecer solo bloques heading"""
        blocks = [
            {"type": "heading", "text": "Main Title"},
            {"type": "heading", "text": "  Subtitle  "},
        ]
        title_map = {}

        result = prepare_chunks.enrich_text_blocks(blocks, title_map)

        assert len(result) == 2
        assert result[0]["enriched_text"] == "Main Title"
        assert result[1]["enriched_text"] == "Subtitle"

    def test_enrich_text_blocks_image_no_ocr(self):
        """Test enriquecer imagen sin OCR"""
        blocks = [
            {"type": "image", "description": "An image"},
        ]
        title_map = {}

        result = prepare_chunks.enrich_text_blocks(blocks, title_map)

        assert len(result) == 1
        assert "enriched_text" not in result[0]


class TestSaveEnrichedJsonl:
    """Pruebas para save_enriched_jsonl"""

    def test_save_enriched_jsonl_success(self):
        """Test guardar archivo JSONL enriquecido"""
        blocks = [{"type": "text", "enriched_text": "Test content"}]

        with patch("builtins.open", mock_open()) as mock_file:
            prepare_chunks.save_enriched_jsonl(blocks, "output.jsonl")

        mock_file.assert_called_once_with("output.jsonl", "w", encoding="utf-8")
        handle = mock_file()
        handle.write.assert_called()


class TestPrintSampleChunks:
    """Pruebas para print_sample_chunks"""

    def test_print_sample_chunks_success(self, capsys):
        """Test mostrar chunks de ejemplo"""
        blocks = [
            {"type": "text", "enriched_text": "Test content 1", "page": 1, "block_id": "b1", "parent": "p1"},
            {"type": "text", "enriched_text": "Test content 2", "page": 2, "block_id": "b2", "parent": "p2"},
        ]

        prepare_chunks.print_sample_chunks(blocks, num_samples=1)

        captured = capsys.readouterr()
        assert "Ejemplos de Chunks Enriquecidos" in captured.out
        assert "Test content 1" in captured.out

    def test_print_sample_chunks_no_text_blocks(self, capsys):
        """Test mostrar chunks cuando no hay bloques de texto"""
        blocks = [
            {"type": "heading", "text": "Title"},
            {"type": "image", "ocr": "Image text"},
        ]

        prepare_chunks.print_sample_chunks(blocks)

        captured = capsys.readouterr()
        assert "Ejemplos de Chunks Enriquecidos" in captured.out

    def test_print_sample_chunks_long_text(self, capsys):
        """Test mostrar chunks con texto largo (debe truncar)"""
        long_text = "a" * 300  # Texto más largo que 200 caracteres
        blocks = [
            {"type": "text", "enriched_text": long_text, "page": 1, "block_id": "b1", "parent": "p1"},
        ]

        prepare_chunks.print_sample_chunks(blocks, num_samples=1)

        captured = capsys.readouterr()
        assert "..." in captured.out  # Debe estar truncado
