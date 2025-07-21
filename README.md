# Confidens v2

<p align="center">
  <img src="@confidens.png" alt="Confidens Logo" width="200"/>
</p>

<p align="center">
    Plataforma avanzada de chat y análisis de datos basada en Next.js 15 y la AI SDK que permite construir experiencias de IA conversacional potentes e intuitivas.
</p>

<p align="center">
  <a href="#características"><strong>Características</strong></a> ·
  <a href="#tecnologías"><strong>Tecnologías</strong></a> ·
  <a href="#arquitectura"><strong>Arquitectura</strong></a> ·
  <a href="#instalación-y-desarrollo"><strong>Instalación</strong></a> ·
  <a href="#sistema-rag"><strong>Sistema RAG</strong></a> ·
  <a href="#convenciones-de-desarrollo"><stronimage.pngg>Convenciones</stronimage.pngg></a>
</p>
<br/>

## Características

### Chat Avanzado con IA
- **Conversaciones contextuales** con historial persistente
- **Modelos IA de última generación** (OpenAI, Anthropic, Google, xAI)
- **Carga y análisis de archivos** PDF con procesamiento automático
- **Herramientas integradas** para análisis de datos

### Sistema RAG (Retrieval-Augmented Generation)
- **Procesamiento inteligente de PDFs** con extracción de estructura y contexto
- **Búsqueda híbrida** combinando búsqueda vectorial y por palabras clave
- **Embeddings de alta calidad** con Voyage AI
- **Base de datos vectorial** con Qdrant para recuperación eficiente
- **API FastAPI** dedicada para operaciones RAG
- **Pipeline de enriquecimiento** de documentos para mejor comprensión contextual

### Artifacts - Generación de Contenido Interactivo
- **Editor de texto** con sugerencias en tiempo real usando ProseMirror
- **Editor de código** con ejecución Python en el navegador (Pyodide)
- **Generación de imágenes** con modelos de IA integrados
- **Hojas de cálculo** editables con capacidades de análisis de datos
- **Control de versiones** para todos los artifacts con historial de cambios

### Interfaz Moderna y Responsiva
- **Diseño accesible** y mobile-first
- **Temas claro/oscuro** adaptativos
- **Componentes UI reutilizables** con shadcn/ui
- **Experiencia de usuario pulida** con animaciones fluidas

### Arquitectura Robusta
- **React Server Components (RSCs)** para rendimiento óptimo
- **Server Actions** para operaciones seguras del lado del servidor
- **Base de datos dual**: PostgreSQL/Supabase para datos principales y Qdrant para vectores
- **Sistema de autenticación** completo con NextAuth

## Tecnologías

### Frontend
- [Next.js 15](https://nextjs.org) con App Router
- [React 19](https://react.dev) con Server Components
- [Tailwind CSS](https://tailwindcss.com) para estilos
- [Shadcn/ui](https://ui.shadcn.com) para componentes de interfaz
- [Framer Motion](https://www.framer.com/motion/) para animaciones

### Backend y Base de Datos
- [PostgreSQL](https://postgresql.org) con [Drizzle ORM](https://orm.drizzle.team)
- [Qdrant](https://qdrant.tech) como base de datos vectorial
- [FastAPI](https://fastapi.tiangolo.com) para API del sistema RAG
- [NextAuth](https://next-auth.js.org) para autenticación

### IA y Procesamiento
- [AI SDK](https://sdk.vercel.ai/docs) para integración con modelos de IA
- [Voyage AI](https://www.voyageai.com) para embeddings de alta calidad
- [LangChain](https://python.langchain.com) para text splitting
- [Transformers.js](https://huggingface.co/docs/transformers.js) para reranking
- [PyMuPDF](https://pymupdf.readthedocs.io) para procesamiento de PDFs

### Editores y Herramientas Interactivas
- [ProseMirror](https://prosemirror.net) para edición de texto avanzada
- [CodeMirror](https://codemirror.net) para edición de código
- [Pyodide](https://pyodide.org) para ejecución de Python en el navegador
- [React Data Grid](https://github.com/adazzle/react-data-grid) para hojas de cálculo

### Herramientas de Desarrollo
- [TypeScript](https://www.typescriptlang.org/) con configuración estricta
- [Biome](https://biomejs.dev) para linting y formateo
- [Playwright](https://playwright.dev) para pruebas e2e
- [pnpm](https://pnpm.io) como gestor de paquetes JavaScript
- [uv](https://docs.astral.sh/uv/) como gestor de paquetes Python

## Arquitectura

### Estructura del Proyecto

```
└─ /
   ├─ app/                    # Rutas de Next.js con App Router
   │  ├─ (auth)/             # Grupo de rutas para autenticación
   │  ├─ (chat)/             # Grupo de rutas para chat
   │  ├─ api/                # API Routes de Next.js
   │  └─ */                  # Otras rutas de la aplicación
   ├─ artifacts/             # Sistema de artifacts interactivos
   │  ├─ code/               # Artifacts de código
   │  ├─ image/              # Artifacts de imágenes
   │  ├─ sheet/              # Artifacts de hojas de cálculo
   │  └─ text/               # Artifacts de texto
   ├─ components/            # UI compartida (diseño atómico)
   ├─ lib/                   # Helpers, utils, clientes de API
   │  └─ rag/                # Sistema RAG completo
   │     ├─ api/             # API FastAPI para RAG
   │     ├─ core/            # Lógica central del sistema
   │     ├─ pdf_extraction/  # Pipeline de procesamiento de PDFs
   │     └─ db/              # Esquemas y migraciones específicas
   ├─ hooks/                 # Hooks de React reutilizables
   ├─ tests/                 # Pruebas e2e con Playwright
   └─ public/                # Activos estáticos
```

### Flujo del Sistema RAG

```mermaid
graph TD
    A[PDF Upload] --> B[PyMuPDF Extraction]
    B --> C[Text Cleaning & Structure]
    C --> D[Context Enrichment]
    D --> E[Voyage AI Embeddings]
    E --> F[Qdrant Storage]
    
    G[User Query] --> H[Query Embedding]
    H --> I[Hybrid Search]
    I --> J[Vector Search]
    I --> K[Keyword Search]
    J --> L[Result Reranking]
    K --> L
    L --> M[Context Assembly]
    M --> N[AI Response]
```

## Instalación y Desarrollo

### Requisitos Previos

- **Node.js 20+** para el frontend
- **Python 3.9+** para el sistema RAG
- **pnpm 9.x** para dependencias JavaScript
- **uv** para dependencias Python
- **Docker** (opcional) para servicios auxiliares

### Configuración de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# Base de datos principal
DATABASE_URL="postgresql://user:password@localhost:5432/confidens_v2"

# Autenticación
NEXTAUTH_SECRET="tu-secret-aleatorio"
NEXTAUTH_URL="http://localhost:3000"

# Modelos de IA
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_GENERATIVE_AI_API_KEY="AI..."
XAI_API_KEY="xai-..."

# Sistema RAG
VOYAGE_API_KEY="pa-..."
QDRANT_URL="http://localhost:6333"
QDRANT_API_KEY=""  # Opcional para Qdrant Cloud

# Configuración RAG
VOYAGE_MODEL="voyage-3.5"
QDRANT_COLLECTION="documents"
```

### Instalación

#### Opción 1: Inicio Automático (Recomendado) 🚀

```bash
# 1. Instalar dependencias JavaScript
pnpm install

# 2. Configurar bases de datos
pnpm db:migrate        # Base de datos principal
pnpm db:migrate:rag    # Base de datos RAG

# 3. Iniciar servicios con Docker (opcional)
docker-compose up -d qdrant

# 4. ¡Inicio automático de todo!
./start-dev.sh
```

**El script `start-dev.sh` hace todo automáticamente:**
- ✅ Verifica dependencias (uv, pnpm)
- ✅ Configura entorno Python y instala dependencias
- ✅ Inicia FastAPI (puerto 8000) en background
- ✅ Inicia Next.js (puerto 3000) en background  
- ✅ Maneja ambos procesos con un solo Ctrl+C
- ✅ Muestra URLs útiles al completar

#### Opción 2: Manual (Si necesitas control individual)

```bash
# Terminal 1: API RAG
cd lib/rag && uv sync && cd ../..
pnpm rag:dev          # FastAPI (puerto 8000)

# Terminal 2: Frontend  
pnpm dev              # Next.js (puerto 3000)
```

**Una vez iniciado, tendrás acceso a:**
- 📱 **App Principal**: http://localhost:3000
- 🧪 **Prueba de RAG**: http://localhost:3000/rag-test  
- 🐍 **FastAPI**: http://localhost:8000
- 📖 **Documentación API**: http://localhost:8000/docs

### Comandos de Desarrollo

```bash
# Inicio rápido (Recomendado)
./start-dev.sh        # Inicia FastAPI + Next.js automáticamente

# Desarrollo individual
pnpm dev              # Solo Next.js (puerto 3000)
pnpm rag:dev          # Solo FastAPI (puerto 8000)
pnpm build            # Construir para producción
pnpm start            # Servidor de producción

# Calidad de código
pnpm lint             # Verificar código
pnpm format           # Formatear código
pnpm test             # Ejecutar pruebas e2e

# Base de datos
pnpm db:studio        # Drizzle Studio
pnpm db:generate      # Generar migraciones
pnpm db:push          # Aplicar cambios directos

# Sistema RAG
pnpm rag:test         # Probar conexiones RAG
pnpm test:rag         # Pruebas de búsqueda híbrida
```

## Sistema RAG

El sistema RAG (Retrieval-Augmented Generation) es una funcionalidad central que permite:

### Procesamiento Inteligente de Documentos
- **Extracción estructurada** de PDFs preservando jerarquía de secciones
- **Limpieza automática** de texto y detección de elementos
- **Enriquecimiento contextual** de chunks para mejor comprensión
- **OCR opcional** para documentos escaneados

### Búsqueda Híbrida Avanzada
- **Búsqueda vectorial** usando embeddings de Voyage AI
- **Búsqueda por palabras clave** con PostgreSQL full-text
- **Combinación inteligente** con Reciprocal Rank Fusion (RRF)
- **Reranking** usando modelos de Transformers.js

### API FastAPI Dedicada
La API RAG corre independientemente en el puerto 8000:

```bash
# Endpoints principales
POST /api/documents/upload    # Subir y procesar documentos
GET  /api/documents/list      # Listar documentos procesados
POST /api/search             # Búsqueda híbrida
DELETE /api/documents/{id}    # Eliminar documentos
GET  /api/health             # Estado del sistema
```

### Integración con el Chat
El sistema RAG se integra automáticamente con el chat principal:
- Los documentos subidos se procesan automáticamente
- Las consultas activan búsqueda RAG cuando es relevante
- Las respuestas incluyen contexto de los documentos

## Artifacts

Los artifacts permiten generar y editar contenido interactivo:

### Tipos de Artifacts
- **📝 Texto**: Editor rico con ProseMirror y sugerencias de IA
- **💻 Código**: Editor con sintaxis destacada y ejecución Python
- **🖼️ Imagen**: Generación con modelos de IA integrados
- **📊 Hoja**: Editor de datos tabulares con análisis

### Características Avanzadas
- **Control de versiones** completo con diff visual
- **Colaboración** en tiempo real con sugerencias
- **Ejecución segura** de código Python en el navegador
- **Exportación** en múltiples formatos

## Convenciones de Desarrollo

### Código y Estilo
- **Biome** como fuente única de verdad para formateo y linting
- **lineWidth: 100**, quoteStyle: single, semi: always
- **TypeScript** con strict: true y noImplicitAny: true
- **Python** con formateo Black y linting Ruff

### Nomenclatura
- **Archivos/carpetas**: kebab-case (`user-card.tsx`)
- **Componentes React**: PascalCase (`UserCard`)
- **Variables/funciones**: camelCase (`fetchUser`)
- **Constantes**: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT_MS`)

### Git y Control de Código
- **Ramas**: `feat/scope`, `fix/scope`, `refactor/scope`
- **Commits**: Conventional Commits + Gitmoji en inglés
  - Ejemplo: `✨ feat(rag): implement hybrid search`
- **PRs pequeños** con verificaciones de CI

### Rendimiento y Accesibilidad
- **React Server Components** priorizados para páginas con datos
- **next/image** para imágenes optimizadas
- **Contraste mínimo** de 4.5:1 (WCAG AA)
- **Diseño mobile-first** con breakpoints consistentes

### Testing
- **Playwright** para pruebas e2e del frontend
- **pytest** para pruebas del sistema RAG Python
- **Cobertura mínima** del 80% en componentes críticos

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
