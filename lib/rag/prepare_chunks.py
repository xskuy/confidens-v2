#!/usr/bin/env python3
"""
Script para enriquecer chunks de texto con el título de su sección padre.
Procesa la salida de pipeline.py y genera un archivo JSONL optimizado para sistemas RAG.

Uso:
    python prepare_chunks.py input.jsonl -o output_enriched.jsonl
"""

import argparse
import json
import os


def load_jsonl(file_path: str) -> list[dict]:
    """Carga un archivo JSONL y retorna una lista de diccionarios."""
    blocks = []
    with open(file_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                blocks.append(json.loads(line))
    return blocks


def build_title_map(blocks: list[dict]) -> dict[str, str]:
    """
    Construye un mapa de section_path -> título completo.
    Solo incluye bloques de tipo 'heading'.
    """
    title_map = {}
    for block in blocks:
        if block.get("type") == "heading":
            section_path = block.get("section_path")
            title = block.get("text", "")
            if section_path and title:
                title_map[section_path] = title
    return title_map


def enrich_text_blocks(blocks: list[dict], title_map: dict[str, str]) -> list[dict]:
    """
    Enriquece los bloques de texto añadiendo el título de la sección padre.
    """
    enriched_blocks = []

    for block in blocks.copy():
        # Copiar el bloque original
        enriched_block = block.copy()

        # Solo enriquecer bloques de tipo 'text' que tengan un 'parent'
        if block.get("type") == "text" and block.get("parent") and block.get("text", "").strip():
            parent_path = block["parent"]
            parent_title = title_map.get(parent_path)

            if parent_title:
                # Crear el texto enriquecido
                original_text = block["text"].strip()
                enriched_text = f"Sección: {parent_title}\n\nContenido: {original_text}"

                # Añadir el campo enriched_text
                enriched_block["enriched_text"] = enriched_text

                # Opcional: También mantener el texto original
                enriched_block["original_text"] = original_text
            else:
                # Si no hay título padre, usar solo el texto original
                enriched_block["enriched_text"] = block["text"].strip()
                enriched_block["original_text"] = block["text"].strip()

        # Para bloques que no son de texto, mantener la estructura original
        elif block.get("type") == "heading":
            # Los headings también pueden ser útiles para búsqueda
            enriched_block["enriched_text"] = block.get("text", "").strip()
        elif block.get("type") == "image" and block.get("ocr"):
            # Las imágenes con OCR también pueden ser útiles
            enriched_block["enriched_text"] = f"Imagen (OCR): {block.get('ocr', '').strip()}"

        enriched_blocks.append(enriched_block)

    return enriched_blocks


def save_enriched_jsonl(blocks: list[dict], output_path: str):
    """Guarda los bloques enriquecidos en un archivo JSONL."""
    with open(output_path, "w", encoding="utf-8") as f:
        for block in blocks:
            f.write(json.dumps(block, ensure_ascii=False) + "\n")


def print_sample_chunks(blocks: list[dict], num_samples: int = 3):
    """Muestra algunos ejemplos de chunks enriquecidos."""
    print("\n--- Ejemplos de Chunks Enriquecidos ---")

    text_blocks = [b for b in blocks if b.get("type") == "text" and b.get("enriched_text")]

    for i, block in enumerate(text_blocks[:num_samples]):
        print(f"\n{i + 1}. Página {block.get('page', 'N/A')}, Block ID {block.get('block_id', 'N/A')}")
        print(f"Parent: {block.get('parent', 'N/A')}")
        print("Texto enriquecido:")
        print("-" * 50)
        enriched = block.get("enriched_text", "")
        # Show only the first 200 characters to avoid overwhelming the console
        preview = enriched[:200] + "..." if len(enriched) > 200 else enriched
        print(preview)
        print("-" * 50)


def main():
    parser = argparse.ArgumentParser(
        description="Enriquece chunks de texto con títulos de sección para optimizar sistemas RAG."
    )
    parser.add_argument("input_jsonl", help="Archivo JSONL de entrada (salida de pipeline.py)")
    parser.add_argument(
        "-o",
        "--output",
        help="Archivo JSONL de salida. Si no se especifica, se añade '_enriched' al nombre original.",
    )
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Mostrar ejemplos de chunks enriquecidos sin guardar archivo",
    )

    args = parser.parse_args()

    if not os.path.exists(args.input_jsonl):
        print(f"Error: No se encontró el archivo '{args.input_jsonl}'")
        return

    # Determinar ruta de salida
    if args.output:
        output_path = args.output
    else:
        base_name = os.path.basename(args.input_jsonl)
        file_name, ext = os.path.splitext(base_name)
        output_dir = os.path.dirname(args.input_jsonl)
        output_path = os.path.join(output_dir, f"{file_name}_enriched{ext}")

    print(f"Cargando archivo: {args.input_jsonl}")

    try:
        # Cargar bloques
        blocks = load_jsonl(args.input_jsonl)
        print(f"Cargados {len(blocks)} bloques")

        # Construir mapa de títulos
        title_map = build_title_map(blocks)
        print(f"Encontrados {len(title_map)} títulos de sección")

        # Enriquecer bloques
        enriched_blocks = enrich_text_blocks(blocks, title_map)

        # Contar bloques enriquecidos
        enriched_count = sum(1 for b in enriched_blocks if b.get("enriched_text"))
        print(f"Enriquecidos {enriched_count} bloques con contexto")

        # Mostrar ejemplos
        print_sample_chunks(enriched_blocks)

        if not args.preview:
            # Guardar archivo enriquecido
            save_enriched_jsonl(enriched_blocks, output_path)
            print(f"\nArchivo enriquecido guardado en: {output_path}")
            print("\nEste archivo está listo para ser usado en tu sistema RAG.")
            print("Usa el campo 'enriched_text' para crear los embeddings vectoriales.")
        else:
            print("\nModo preview activado - no se guardó ningún archivo.")

    except Exception as e:
        print(f"Error durante el procesamiento: {e}")


if __name__ == "__main__":
    main()
