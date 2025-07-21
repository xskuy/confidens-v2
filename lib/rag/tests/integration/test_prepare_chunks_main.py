#!/usr/bin/env python3
"""
Pruebas de integración para la función main de prepare_chunks.py
"""

import os
import sys
from unittest.mock import patch

# Agregar el directorio padre al path para imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import prepare_chunks


class TestPrepareChunksMain:
    """Pruebas de integración para la función main"""

    @patch("prepare_chunks.load_jsonl")
    @patch("prepare_chunks.build_title_map")
    @patch("prepare_chunks.enrich_text_blocks")
    @patch("prepare_chunks.print_sample_chunks")
    @patch("prepare_chunks.save_enriched_jsonl")
    @patch("os.path.exists")
    def test_main_preview_mode(self, mock_exists, mock_save, mock_print, mock_enrich, mock_build, mock_load):
        """Test función main en modo preview"""
        mock_exists.return_value = True
        mock_load.return_value = [{"type": "text", "text": "test"}]
        mock_build.return_value = {"1": "Title 1"}
        mock_enrich.return_value = [{"type": "text", "enriched_text": "enriched"}]

        test_args = ["prepare_chunks.py", "input.jsonl", "--preview"]
        with patch("sys.argv", test_args):
            prepare_chunks.main()

        mock_load.assert_called_once()
        mock_build.assert_called_once()
        mock_enrich.assert_called_once()
        mock_print.assert_called_once()
        mock_save.assert_not_called()  # No debe guardar en modo preview

    @patch("prepare_chunks.load_jsonl")
    @patch("prepare_chunks.build_title_map")
    @patch("prepare_chunks.enrich_text_blocks")
    @patch("prepare_chunks.print_sample_chunks")
    @patch("prepare_chunks.save_enriched_jsonl")
    @patch("os.path.exists")
    def test_main_normal_mode(self, mock_exists, mock_save, mock_print, mock_enrich, mock_build, mock_load):
        """Test función main en modo normal"""
        mock_exists.return_value = True
        mock_load.return_value = [{"type": "text", "text": "test"}]
        mock_build.return_value = {"1": "Title 1"}
        mock_enrich.return_value = [{"type": "text", "enriched_text": "enriched"}]

        test_args = ["prepare_chunks.py", "input.jsonl", "-o", "output.jsonl"]
        with patch("sys.argv", test_args):
            prepare_chunks.main()

        mock_load.assert_called_once()
        mock_build.assert_called_once()
        mock_enrich.assert_called_once()
        mock_print.assert_called_once()
        mock_save.assert_called_once_with(mock_enrich.return_value, "output.jsonl")

    @patch("os.path.exists")
    def test_main_file_not_exists(self, mock_exists, capsys):
        """Test función main con archivo que no existe"""
        mock_exists.return_value = False

        test_args = ["prepare_chunks.py", "nonexistent.jsonl"]
        with patch("sys.argv", test_args):
            prepare_chunks.main()

        captured = capsys.readouterr()
        assert "Error: No se encontró el archivo" in captured.out

    @patch("prepare_chunks.load_jsonl")
    @patch("os.path.exists")
    def test_main_with_exception(self, mock_exists, mock_load, capsys):
        """Test función main con excepción durante el procesamiento"""
        mock_exists.return_value = True
        mock_load.side_effect = Exception("Test error")

        test_args = ["prepare_chunks.py", "input.jsonl"]
        with patch("sys.argv", test_args):
            prepare_chunks.main()

        captured = capsys.readouterr()
        assert "Error durante el procesamiento" in captured.out

    @patch("prepare_chunks.load_jsonl")
    @patch("prepare_chunks.build_title_map")
    @patch("prepare_chunks.enrich_text_blocks")
    @patch("prepare_chunks.print_sample_chunks")
    @patch("prepare_chunks.save_enriched_jsonl")
    @patch("os.path.exists")
    def test_main_default_output_path(self, mock_exists, mock_save, mock_print, mock_enrich, mock_build, mock_load):
        """Test función main con ruta de salida por defecto"""
        mock_exists.return_value = True
        mock_load.return_value = [{"type": "text", "text": "test"}]
        mock_build.return_value = {"1": "Title 1"}
        mock_enrich.return_value = [{"type": "text", "enriched_text": "enriched"}]

        # Sin especificar -o, debe generar nombre automáticamente
        test_args = ["prepare_chunks.py", "/path/to/input.jsonl"]
        with patch("sys.argv", test_args):
            prepare_chunks.main()

        # Verificar que se llamó save con el nombre por defecto
        expected_output = "/path/to/input_enriched.jsonl"
        mock_save.assert_called_once()
        actual_output = mock_save.call_args[0][1]
        assert actual_output == expected_output
