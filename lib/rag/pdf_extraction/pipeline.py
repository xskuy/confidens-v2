import argparse
import io
import json
import os
import re

import fitz  # PyMuPDF
import numpy as np
from PIL import Image

# Global variables
ocr_model = None

# —--- 1. Regex más tolerante (acepta "1.-", "1.1.-", "2 Título", etc.) —---
HEADING_PATTERN = re.compile(r"^\s*([\d\.]+-?)\s+(.*)")

# 3) Filtrar el índice de contenido
TOC_LINE = re.compile(r"\.{5,}\s+\d+$")  # ...... 4


def initialize_ocr(use_gpu=True, lang="es"):
    """
    Initializes the PaddleOCR model.
    It's a global singleton to avoid reloading the model.
    """
    global ocr_model
    if ocr_model:
        return

    try:
        from paddleocr import PaddleOCR
    except ImportError:
        print("Error: paddleocr no está instalado. Ejecuta 'pip install paddleocr'.")
        return

    try:
        print(f"Initializing PaddleOCR with lang='{lang}' and use_gpu={use_gpu}...")

        # The `use_gpu` parameter causes an error in newer versions if False.
        # We build the config dictionary conditionally.
        ocr_config = {"use_angle_cls": True, "lang": lang}
        if use_gpu:
            ocr_config["use_gpu"] = True

        ocr_model = PaddleOCR(**ocr_config)
        print("PaddleOCR initialized successfully.")
    except Exception as e:
        if use_gpu:
            print(f"Fatal: Could not initialize PaddleOCR with GPU. Error: {e}")
            print("Please ensure you have a compatible NVIDIA GPU and CUDA installed.")
            print("Falling back to CPU...")
            initialize_ocr(use_gpu=False, lang=lang)
        else:
            print(f"Fatal: Could not initialize PaddleOCR with CPU. Error: {e}")


def get_text_from_image(image_bytes):
    """Performs OCR on an image byte stream."""
    if not ocr_model:
        # print("OCR model not available.")
        return ""

    try:
        # Convert bytes to a numpy array, which PaddleOCR expects.
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(image)

        # The `ocr` method is deprecated and its arguments changed.
        # The new `predict` method is used instead.
        result = ocr_model.predict(image_np)

        # Ensure result is not None and has the expected structure
        if result and result[0] is not None:
            # result = [[(line_info, (text, confidence_score))], ...]
            # We need to access the text part of each line.
            text_lines = [line[1][0] for line in result[0]]
            return " ".join(text_lines)
    except Exception as e:
        # This can happen with unsupported image formats or other issues.
        # We print the error but continue processing.
        if "Not supported" in str(e) or "cannot identify image" in str(e):
            pass  # Ignore warnings for unsupported formats like TIFFs in PDFs
        else:
            print(f"An error occurred during OCR: {e}")
    return ""


def analyze_font_sizes(doc):
    """
    # 1) Calcular bien body_font_size y heading_font_size
    """
    font_counts = {}
    for page in doc:
        for b in page.get_text("dict")["blocks"]:
            if b["type"] == 0:
                for l in b["lines"]:
                    for s in l["spans"]:
                        fs = round(s["size"])
                        font_counts[fs] = font_counts.get(fs, 0) + len(s["text"])

    if not font_counts:
        return 12, 13  # Defaults

    ordered = sorted(font_counts.items(), key=lambda kv: kv[1], reverse=True)
    body = ordered[0][0]  # moda → cuerpo
    heading = ordered[1][0] if len(ordered) > 1 else body + 1
    return body, heading


def is_potential_heading(text, font_size, body_size, heading_size):
    """Checks if a line of text is a potential heading based on heuristics."""
    # (a) tamaño
    if font_size + 0.5 < heading_size:
        return False
    # (b) cantidad de palabras (evita celdas de tabla)
    if len(text.split()) < 3:
        return False
    # (c) no debe contener cifras de dinero
    if re.search(r"\$|UF|%", text):
        return False
    return True


def process_pdf(doc, output_path):
    all_blocks = []
    block_id_counter = 0
    section_stack = []
    body_font_size, heading_font_size = analyze_font_sizes(doc)
    found_first_numeric_heading = False
    toc_page_num = None

    for page_num, page in enumerate(doc, 1):
        page_rect = page.rect
        page_area = page_rect.width * page_rect.height

        # 3 · Opcional: reiniciar section_stack al cambiar de página antes del primer heading numérico
        if page_num > 1 and not found_first_numeric_heading:
            section_stack = []

        current_heading_path = section_stack[-1]["path"] if section_stack else None

        # Rule #7: Filter out large, page-sized images.
        image_infos = page.get_image_info(xrefs=True)
        for img_info in image_infos:
            bbox = img_info["bbox"]
            img_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
            if page_area > 0 and img_area / page_area > 0.90:
                continue

            try:
                img_bytes = doc.extract_image(img_info["xref"])["image"]
                ocr_text = get_text_from_image(img_bytes)
            except Exception:
                ocr_text = ""  # Could not extract image

            all_blocks.append(
                {
                    "page": page_num,
                    "block_id": block_id_counter,
                    "type": "image",
                    "parent": current_heading_path,
                    "bbox": [round(c) for c in bbox],
                    "ocr": ocr_text,
                }
            )
            block_id_counter += 1

        blocks = page.get_text("dict").get("blocks", [])
        for block in blocks:
            if block["type"] != 0:
                continue

            block_text_content = "".join(span["text"] for line in block["lines"] for span in line["spans"]).strip()
            if block_text_content.isdigit() and block["bbox"][3] > page_rect.height - 80:
                continue

            block_full_text = "\n".join("".join(s["text"] for s in l["spans"]) for l in block["lines"])
            lines_in_block = block_full_text.split("\n")
            is_toc_like = len(lines_in_block) > 1 and len(HEADING_PATTERN.findall(block_full_text)) > 1

            if is_toc_like:
                process_lines = lines_in_block
            else:
                process_lines = [block_full_text]

            for line_text in process_lines:
                if not line_text.strip():
                    continue

                if TOC_LINE.search(line_text):
                    parent_path = section_stack[-1]["path"] if section_stack else None
                    all_blocks.append(
                        {
                            "page": page_num,
                            "block_id": block_id_counter,
                            "type": "text",
                            "parent": parent_path,
                            "text": line_text.strip(),
                        }
                    )
                    block_id_counter += 1
                    continue

                # 2 · Vaciar la pila al detectar el Índice de Contenido
                if ("Índice de Contenido" in line_text or "Indice" in line_text) and toc_page_num is None:
                    toc_page_num = page_num
                    section_stack = []
                    parent_path = None
                    all_blocks.append(
                        {
                            "page": page_num,
                            "block_id": block_id_counter,
                            "type": "text",
                            "parent": parent_path,
                            "text": line_text.strip(),
                        }
                    )
                    block_id_counter += 1
                    continue

                # Ignore any potential headings on the table of contents page
                if page_num == toc_page_num:
                    parent_path = section_stack[-1]["path"] if section_stack else None
                    all_blocks.append(
                        {
                            "page": page_num,
                            "block_id": block_id_counter,
                            "type": "text",
                            "parent": None,
                            "text": line_text.strip(),
                        }
                    )
                    block_id_counter += 1
                    continue

                try:
                    line_font_size = round(block["lines"][0]["spans"][0]["size"])
                except (IndexError, KeyError):
                    line_font_size = body_font_size

                is_heading = False
                numeric_match = HEADING_PATTERN.match(line_text)

                if numeric_match and is_potential_heading(line_text, line_font_size, body_font_size, heading_font_size):
                    raw_num = numeric_match.group(1)
                    number_str = re.sub(r"[.\-]+$", "", raw_num)  # ej. "1.-" -> "1"
                    level = number_str.count(".") + 1

                    # Rule #2: Ignore level 1 items that are not significantly larger than body
                    if level == 1 and line_font_size <= body_font_size:
                        is_heading = False
                    else:
                        is_heading = True
                        title = numeric_match.group(2).strip()
                        if not found_first_numeric_heading:
                            section_stack = []
                        found_first_numeric_heading = True

                is_bold_style = line_font_size + 0.5 >= heading_font_size or line_text.isupper() or line_text.istitle()
                if not is_heading and is_bold_style and not found_first_numeric_heading:
                    # Synthetic heading for cover page etc.
                    is_heading = True
                    title = line_text
                    level = section_stack[-1]["level"] + 1 if section_stack else 1
                    number_str = f"u{block_id_counter}"

                if is_heading:
                    # This part only runs for numeric or synthetic headings
                    while section_stack and section_stack[-1]["level"] >= level:
                        section_stack.pop()

                    parent_path = section_stack[-1]["path"] if section_stack else None
                    section_path = f"{parent_path}/{number_str}" if parent_path else number_str

                    section_stack.append({"level": level, "path": section_path})

                    all_blocks.append(
                        {
                            "page": page_num,
                            "block_id": block_id_counter,
                            "type": "heading",
                            "level": level,
                            "parent": parent_path,
                            "section_path": section_path,
                            "text": f"{number_str} {title}" if numeric_match else title,
                        }
                    )
                else:
                    # Just normal text
                    parent_path = section_stack[-1]["path"] if section_stack else None
                    all_blocks.append(
                        {
                            "page": page_num,
                            "block_id": block_id_counter,
                            "type": "text",
                            "parent": parent_path,
                            "text": line_text.strip(),
                        }
                    )
                block_id_counter += 1

    with open(output_path, "w", encoding="utf-8") as f:
        for block in all_blocks:
            f.write(json.dumps(block, ensure_ascii=False) + "\n")

    print("\n--- Quick Check: Headings ---")
    for b in all_blocks:
        if b["type"] == "heading":
            path = b.get("section_path", "N/A")
            print(f"{path} {b['text'][:80]}")
    print("---------------------------\n")


def extract_blocks(doc):
    """
    Extract structured blocks from a PDF document.

    Args:
        doc: PyMuPDF document object

    Returns:
        List of block dictionaries
    """
    all_blocks = []
    block_id_counter = 0
    section_stack = []
    body_font_size, heading_font_size = analyze_font_sizes(doc)
    found_first_numeric_heading = False
    toc_page_num = None

    for page_num, page in enumerate(doc, 1):
        page_rect = page.rect
        page_area = page_rect.width * page_rect.height

        # 3 · Opcional: reiniciar section_stack al cambiar de página antes del primer heading numérico
        if page_num > 1 and not found_first_numeric_heading:
            section_stack = []

        current_heading_path = section_stack[-1]["path"] if section_stack else None

        # Rule #7: Filter out large, page-sized images.
        image_infos = page.get_image_info(xrefs=True)
        for img_info in image_infos:
            bbox = img_info["bbox"]
            img_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
            if page_area > 0 and img_area / page_area > 0.90:
                continue

            try:
                img_bytes = doc.extract_image(img_info["xref"])["image"]
                ocr_text = get_text_from_image(img_bytes)
            except Exception:
                ocr_text = ""  # Could not extract image

            all_blocks.append(
                {
                    "page": page_num,
                    "block_id": block_id_counter,
                    "type": "image",
                    "parent": current_heading_path,
                    "bbox": [round(c) for c in bbox],
                    "ocr": ocr_text,
                }
            )
            block_id_counter += 1

        blocks = page.get_text("dict").get("blocks", [])
        for block in blocks:
            if block["type"] != 0:
                continue

            block_text_content = "".join(span["text"] for line in block["lines"] for span in line["spans"]).strip()
            if block_text_content.isdigit() and block["bbox"][3] > page_rect.height - 80:
                continue

            block_full_text = "\n".join("".join(s["text"] for s in l["spans"]) for l in block["lines"])
            lines_in_block = block_full_text.split("\n")
            is_toc_like = len(lines_in_block) > 1 and len(HEADING_PATTERN.findall(block_full_text)) > 1

            if is_toc_like:
                process_lines = lines_in_block
            else:
                process_lines = [block_full_text]

            for line_text in process_lines:
                if not line_text.strip():
                    continue

                if TOC_LINE.search(line_text):
                    parent_path = section_stack[-1]["path"] if section_stack else None
                    all_blocks.append(
                        {
                            "page": page_num,
                            "block_id": block_id_counter,
                            "type": "text",
                            "parent": parent_path,
                            "text": line_text.strip(),
                        }
                    )
                    block_id_counter += 1
                    continue

                # 2 · Vaciar la pila al detectar el Índice de Contenido
                if ("Índice de Contenido" in line_text or "Indice" in line_text) and toc_page_num is None:
                    toc_page_num = page_num
                    section_stack = []
                    parent_path = None
                    all_blocks.append(
                        {
                            "page": page_num,
                            "block_id": block_id_counter,
                            "type": "text",
                            "parent": parent_path,
                            "text": line_text.strip(),
                        }
                    )
                    block_id_counter += 1
                    continue

                # Ignore any potential headings on the table of contents page
                if page_num == toc_page_num:
                    parent_path = section_stack[-1]["path"] if section_stack else None
                    all_blocks.append(
                        {
                            "page": page_num,
                            "block_id": block_id_counter,
                            "type": "text",
                            "parent": None,
                            "text": line_text.strip(),
                        }
                    )
                    block_id_counter += 1
                    continue

                try:
                    line_font_size = round(block["lines"][0]["spans"][0]["size"])
                except (IndexError, KeyError):
                    line_font_size = body_font_size

                is_heading = False
                numeric_match = HEADING_PATTERN.match(line_text)

                if numeric_match and is_potential_heading(line_text, line_font_size, body_font_size, heading_font_size):
                    raw_num = numeric_match.group(1)
                    number_str = re.sub(r"[.\-]+$", "", raw_num)  # ej. "1.-" -> "1"
                    level = number_str.count(".") + 1

                    # Rule #2: Ignore level 1 items that are not significantly larger than body
                    if level == 1 and line_font_size <= body_font_size:
                        is_heading = False
                    else:
                        is_heading = True
                        title = numeric_match.group(2).strip()
                        if not found_first_numeric_heading:
                            section_stack = []
                        found_first_numeric_heading = True

                is_bold_style = line_font_size + 0.5 >= heading_font_size or line_text.isupper() or line_text.istitle()
                if not is_heading and is_bold_style and not found_first_numeric_heading:
                    # Synthetic heading for cover page etc.
                    is_heading = True
                    title = line_text
                    level = section_stack[-1]["level"] + 1 if section_stack else 1
                    number_str = f"u{block_id_counter}"

                if is_heading:
                    # This part only runs for numeric or synthetic headings
                    while section_stack and section_stack[-1]["level"] >= level:
                        section_stack.pop()

                    parent_path = section_stack[-1]["path"] if section_stack else None
                    section_path = f"{parent_path}/{number_str}" if parent_path else number_str

                    section_stack.append({"level": level, "path": section_path})

                    all_blocks.append(
                        {
                            "page": page_num,
                            "block_id": block_id_counter,
                            "type": "heading",
                            "level": level,
                            "parent": parent_path,
                            "section_path": section_path,
                            "text": f"{number_str} {title}" if numeric_match else title,
                        }
                    )
                else:
                    # Just normal text
                    parent_path = section_stack[-1]["path"] if section_stack else None
                    all_blocks.append(
                        {
                            "page": page_num,
                            "block_id": block_id_counter,
                            "type": "text",
                            "parent": parent_path,
                            "text": line_text.strip(),
                        }
                    )
                block_id_counter += 1

    return all_blocks


def create_dummy_pdf():
    """Creates a dummy PDF with structured content for testing."""
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

    try:
        c = canvas.Canvas("test.pdf", pagesize=letter)
        width, height = letter

        c.setFont("Helvetica-Bold", 16)
        c.drawString(72, height - 72, "1 Introducción")
        c.setFont("Helvetica", 12)
        c.drawString(72, height - 100, "Este es el primer párrafo de la introducción.")

        c.setFont("Helvetica-Bold", 14)
        c.drawString(72, height - 140, "1.1 Sub-sección")
        c.setFont("Helvetica", 12)
        c.drawString(72, height - 168, "Texto dentro de la sub-sección.")

        c.rect(72, height - 300, 200, 100)
        c.drawString(80, height - 290, "Fake image placeholder")

        c.showPage()

        c.setFont("Helvetica-Bold", 16)
        c.drawString(72, height - 72, "2 Conclusiones")
        c.setFont("Helvetica", 12)
        c.drawString(72, height - 100, "Este es el texto de las conclusiones.")

        c.save()
        print("Dummy PDF 'test.pdf' created successfully.")
    except ImportError:
        print("Please install reportlab: pip install reportlab")
    except Exception as e:
        print(f"An error occurred while creating the dummy PDF: {e}")


def main():
    parser = argparse.ArgumentParser(description="Process a PDF to extract structured content as JSONL.")
    parser.add_argument("input_pdf", nargs="?", default=None, help="Path to the input PDF file.")
    parser.add_argument(
        "-o",
        "--output",
        help="Path to the output JSONL file. If not specified, output is saved to lib/rag/output/.",
    )
    parser.add_argument("--gpu", action="store_true", help="Enable GPU for PaddleOCR.")
    parser.add_argument("--create-dummy", action="store_true", help="Create a dummy PDF for testing.")

    args = parser.parse_args()

    if args.create_dummy:
        create_dummy_pdf()
        return

    if not args.input_pdf:
        parser.error("the following arguments are required: input_pdf (unless --create-dummy is used)")

    if not os.path.exists(args.input_pdf):
        print(f"Error: Input PDF file not found at '{args.input_pdf}'")
        print("You can create a sample file with: python pipeline.py --create-dummy")
        return

    output_dir = "lib/rag/output"
    os.makedirs(output_dir, exist_ok=True)

    if args.output:
        output_path = args.output
    else:
        base_name = os.path.basename(args.input_pdf)
        file_name, _ = os.path.splitext(base_name)
        output_path = os.path.join(output_dir, f"{file_name}.jsonl")

    initialize_ocr(use_gpu=args.gpu)

    try:
        doc = fitz.open(args.input_pdf)
    except Exception as e:
        print(f"Error opening PDF file: {e}")
        return

    process_pdf(doc, output_path)

    print(f"Processing complete. Output saved to {output_path}")


if __name__ == "__main__":
    main()
