# Sistema RAG - Preparación de Chunks

Este directorio contiene las herramientas para procesar documentos PDF y prepararlos para sistemas RAG (Retrieval-Augmented Generation).

## Flujo de Trabajo

### 1. Extracción de PDF (`pdf-extraction/pipeline.py`)

Convierte un PDF en un archivo JSONL con chunks estructurados:

```bash
cd pdf-extraction
python pipeline.py "../pdf/documento.pdf"
```

**Salida**: `output/documento.jsonl` con chunks básicos.

### 2. Enriquecimiento de Chunks (`prepare_chunks.py`)

Mejora los chunks añadiendo contexto de sección para optimizar la búsqueda vectorial:

```bash
python prepare_chunks.py "output/documento.jsonl"
```

**Salida**: `output/documento_enriched.jsonl` listo para RAG.

## Estructura de Chunks Enriquecidos

Cada chunk en el archivo final contiene:

```json
{
  "page": 4,
  "block_id": 33,
  "type": "text",
  "parent": "1/1.1",
  "text": "Texto original del párrafo...",
  "enriched_text": "Sección: 1.1 Título de la sección\n\nContenido: Texto original del párrafo...",
  "original_text": "Texto original del párrafo..."
}
```

### Campos Clave

- **`enriched_text`**: Usar este campo para crear embeddings vectoriales
- **`text`/`original_text`**: Texto original sin modificar
- **`parent`**: Referencia a la sección padre
- **`page`**: Número de página del documento original

## ¿Por Qué Enriquecer los Chunks?

### Problema Original
```
Chunk: "Esta opción es la más rentable."
```
❌ Sin contexto, el LLM no sabe de qué opción se habla.

### Solución con Enriquecimiento
```
Chunk: "Sección: 2.3 Análisis de Costos

Contenido: Esta opción es la más rentable."
```
✅ Ahora el LLM tiene contexto completo sobre qué sección trata el contenido.

## Uso en Sistema RAG

1. **Crear embeddings** usando el campo `enriched_text`
2. **Almacenar en base vectorial** con metadatos (`page`, `parent`, etc.)
3. **En búsqueda**: Recuperar chunks relevantes
4. **En respuesta**: Usar `enriched_text` para que el LLM tenga contexto completo

## Comandos Útiles

### Ver ejemplos sin generar archivo
```bash
python prepare_chunks.py "input.jsonl" --preview
```

### Especificar archivo de salida
```bash
python prepare_chunks.py "input.jsonl" -o "mi_archivo_final.jsonl"
```

### Procesar múltiples documentos
```bash
# Procesar todos los JSONL en output/
for file in output/*.jsonl; do
    python prepare_chunks.py "$file"
done
```

## Archivos en este Directorio

- **`pdf-extraction/`**: Scripts para extraer texto de PDFs
  - `pipeline.py`: Extractor principal
  - `clean_text.py`: Limpieza de texto
  - `structure_text.py`: Estructuración jerárquica (alternativa)

- **`prepare_chunks.py`**: Script de enriquecimiento para RAG
- **`output/`**: Archivos JSONL procesados
- **`requirements.txt`**: Dependencias Python

## Integración con tu Sistema RAG

El archivo `*_enriched.jsonl` está listo para ser usado en cualquier sistema RAG:

1. **LangChain**: Cargar como `Document` objects
2. **LlamaIndex**: Usar como `Node` objects  
3. **Custom**: Leer línea por línea y procesar `enriched_text`

### Ejemplo de Uso
```python
import json

# Cargar chunks enriquecidos
with open('output/documento_enriched.jsonl', 'r') as f:
    chunks = [json.loads(line) for line in f if line.strip()]

# Filtrar solo chunks de texto
text_chunks = [c for c in chunks if c.get('type') == 'text']

# Crear embeddings usando enriched_text
for chunk in text_chunks:
    embedding = create_embedding(chunk['enriched_text'])
    # Almacenar en base vectorial...
```

Este enfoque garantiza que cada chunk recuperado por el sistema RAG tenga el contexto necesario para generar respuestas precisas y útiles. 