import argparse
import json
import os
import re


class Node:
    """
    Node class for the document tree.
    """

    def __init__(self, title: str, level: int, content: list[str], children: list["Node"]):
        self.title = title
        self.level = level
        self.content = content
        self.children = children


HEADING_PATTERN = re.compile(r"^\s*(\d[\d\.]*)\s+(.+)")


def classify_line(line: str) -> dict:
    """
    Classifies a line as a heading or text.
    If it's a heading, returns its level, number, and title.
    """
    match = HEADING_PATTERN.match(line)
    if match:
        number_str = match.group(1).strip().strip(".")
        title = match.group(2).strip()
        level = number_str.count(".") + 1
        return {"type": "heading", "level": level, "number": number_str, "title": title}
    else:
        return {"type": "text", "content": line}


def structure_text_content(text_content: str) -> list:
    """
    Toma el contenido de texto limpio y lo estructura en un árbol jerárquico.
    """
    lines = text_content.split("\n\n")
    classified_lines = [classify_line(line) for line in lines if line.strip()]
    return build_tree(classified_lines)


def build_tree(classified_lines: list) -> list:
    """
    Builds a hierarchical tree from a list of classified lines.
    """
    # The root of our document tree
    document_root = {"level": 0, "children": []}

    # A stack to keep track of the current path in the tree.
    # Each element is a pointer to a node in the tree.
    path_stack = [document_root]

    for item in classified_lines:
        if item["type"] == "heading":
            level = item["level"]

            node = {
                "title": f"{item['number']} {item['title']}",
                "level": level,
                "content": [],
                "children": [],
            }

            # Adjust the stack to find the correct parent for the new node.
            # Pop from stack until the parent's level is less than the current node's level.
            while path_stack[-1]["level"] >= level:
                path_stack.pop()

            # The top of the stack is now the parent.
            parent = path_stack[-1]
            parent["children"].append(node)

            # Push the new node onto the stack to become the current context.
            path_stack.append(node)

        elif item["type"] == "text":
            # Text belongs to the most recent heading.
            current_node = path_stack[-1]
            # Only add content if we are inside a real section (level > 0)
            if current_node["level"] > 0:
                current_node["content"].append(item["content"])

    return document_root["children"]


def main():
    """
    Main function to parse arguments and run the structuring process.
    """
    parser = argparse.ArgumentParser(description="Structure a cleaned text file into a hierarchical JSON file.")
    parser.add_argument("input_txt", help="Path to the input cleaned TXT file.")
    parser.add_argument(
        "-o",
        "--output",
        help="Path to the output JSON file. If not specified, it's saved next to the input file with a '_structured' suffix.",
    )
    args = parser.parse_args()

    if not os.path.exists(args.input_txt):
        print(f"Error: Input file not found at '{args.input_txt}'")
        return

    # Determine output path
    if args.output:
        output_path = args.output
    else:
        base_name = os.path.basename(args.input_txt)
        file_name, _ = os.path.splitext(base_name)
        output_dir = os.path.dirname(args.input_txt)
        output_path = os.path.join(output_dir, f"{file_name}_structured.json")

    try:
        with open(args.input_txt, encoding="utf-8") as f:
            # Assume paragraphs are separated by double newlines from the previous script
            cleaned_text = f.read()

        document_tree = structure_text_content(cleaned_text)

        with open(output_path, "w", encoding="utf-8") as f_out:
            json.dump(document_tree, f_out, indent=2, ensure_ascii=False)

        print(f"Structured JSON successfully saved to {output_path}")

    except Exception as e:
        print(f"An error occurred during structuring: {e}")


if __name__ == "__main__":
    main()
