import argparse
import json
import os
import re
import unicodedata


def normalize(text: str) -> str:
    """
    - Homogenize whitespace.
    - Apply Unicode normalization to handle accents and special characters.
    - Remove control characters.
    """
    if not text:
        return ""

    # Apply NFKC Unicode normalization for character consistency
    text = unicodedata.normalize("NFKC", text)

    # Replace multiple whitespace characters with a single space
    text = re.sub(r"\s+", " ", text).strip()

    return text


# 1. Filtra líneas de puntos/guiones
DECOR_RE = re.compile(r"^[.\-•\s]{5,}$")


# 2. Repara números con separador de miles
def fix_numbers(t: str) -> str:
    return re.sub(r"(\d)\.\s+(\d)", r"\1.\2", t)


# —-------------------  NUEVO  —-------------------
NOISE_RE = re.compile(r"(?:[a-zA-Z]\s*){5,}")  # ej. "n a o t o e e e e ..."


def is_noise(line: str) -> bool:
    """
    True si la línea son solo letras sueltas repetidas
    o la misma letra repetida muchas veces.
    """
    if NOISE_RE.fullmatch(line):
        return True
    compact = line.replace(" ", "")
    return len(compact) < 10 and len(set(compact)) <= 3


# —----------------------------------------------


def clean_blocks(blocks: list[dict]) -> str:
    """
    Clean and normalize text blocks extracted from PDF.

    Args:
        blocks: List of block dictionaries from PDF extraction

    Returns:
        Cleaned text as a single string
    """
    full_document_parts = []
    paragraph_buffer = []

    for block in blocks:
        text_content = ""
        is_heading = block.get("type") == "heading"
        is_text = block.get("type") == "text"
        is_image = block.get("type") == "image"

        # When a new heading or image appears, the preceding paragraph (if any) is complete.
        if is_heading or is_image:
            if paragraph_buffer:
                # Normalize and append the completed paragraph
                full_document_parts.append(" ".join(paragraph_buffer))
                paragraph_buffer = []

        if is_heading or is_text:
            text_content = block.get("text", "")
        elif is_image:
            text_content = block.get("ocr", "")

        if not text_content.strip():
            continue

        # Normalize and check for noise
        text_content = normalize(text_content)
        text_content = fix_numbers(text_content)

        if DECOR_RE.fullmatch(text_content):
            continue

        if is_noise(text_content):
            continue

        if is_heading or is_image:
            full_document_parts.append(text_content)
        elif is_text:
            paragraph_buffer.append(text_content)
            # Simple heuristic: flush buffer if text ends a sentence.
            if text_content.strip().endswith((".", ":", "!", "?", ";", ")")):
                full_document_parts.append(" ".join(paragraph_buffer))
                paragraph_buffer = []

    # Flush any remaining text in the buffer
    if paragraph_buffer:
        full_document_parts.append(" ".join(paragraph_buffer))

    # Return the cleaned text
    return "\n\n".join(full_document_parts)


def main():
    """
    Main function to parse arguments and run the text cleaning process.
    """
    parser = argparse.ArgumentParser(
        description="Clean and normalize text from a JSONL file, saving it as a single TXT file."
    )
    parser.add_argument("input_jsonl", help="Path to the input JSONL file.")
    parser.add_argument(
        "-o",
        "--output",
        help="Path to the output TXT file. If not specified, it's saved next to the input file with a '_cleaned' suffix.",
    )
    args = parser.parse_args()

    if not os.path.exists(args.input_jsonl):
        print(f"Error: Input file not found at '{args.input_jsonl}'")
        return

    # Determine output path
    if args.output:
        output_path = args.output
    else:
        base_name = os.path.basename(args.input_jsonl)
        file_name, _ = os.path.splitext(base_name)
        output_dir = os.path.dirname(args.input_jsonl)
        output_path = os.path.join(output_dir, f"{file_name}_cleaned.txt")

    full_document_parts = []
    paragraph_buffer = []

    try:
        with open(args.input_jsonl, encoding="utf-8") as f:
            for line in f:
                block = json.loads(line)

                text_content = ""
                is_heading = block.get("type") == "heading"
                is_text = block.get("type") == "text"
                is_image = block.get("type") == "image"

                # When a new heading or image appears, the preceding paragraph (if any) is complete.
                if is_heading or is_image:
                    if paragraph_buffer:
                        # Normalize and append the completed paragraph
                        full_document_parts.append(" ".join(paragraph_buffer))
                        paragraph_buffer = []

                if is_heading or is_text:
                    text_content = block.get("text", "")
                elif is_image:
                    text_content = block.get("ocr", "")

                if not text_content.strip():
                    continue

                # Normalize and check for noise
                text_content = normalize(text_content)

                #   nuevas normas
                text_content = fix_numbers(text_content)
                if DECOR_RE.fullmatch(text_content):
                    continue

                if is_noise(text_content):
                    continue

                if is_heading or is_image:
                    full_document_parts.append(text_content)
                elif is_text:
                    paragraph_buffer.append(text_content)
                    # Simple heuristic: flush buffer if text ends a sentence.
                    if text_content.strip().endswith((".", ":", "!", "?", ";", ")")):
                        full_document_parts.append(" ".join(paragraph_buffer))
                        paragraph_buffer = []

        # Flush any remaining text in the buffer
        if paragraph_buffer:
            full_document_parts.append(" ".join(paragraph_buffer))

        # Write the final cleaned document to the output file
        with open(output_path, "w", encoding="utf-8") as f_out:
            # Join parts ensuring no double-normalization
            f_out.write("\n\n".join(full_document_parts))

        print(f"Cleaned text successfully saved to {output_path}")

    except json.JSONDecodeError as e:
        print(f"Error reading JSONL file: {e}")
    except OSError as e:
        print(f"Error writing to output file: {e}")


if __name__ == "__main__":
    main()
