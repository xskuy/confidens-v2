# Manual del Sistema Confidens

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Funcionalidades Principales](#funcionalidades-principales)
5. [Administración del Sistema](#administración-del-sistema)
6. [Integración con APIs](#integración-con-apis)
7. [Seguridad y Autenticación](#seguridad-y-autenticación)
8. [Costos y Presupuesto](#costos-y-presupuesto)
9. [Mantenimiento](#mantenimiento)
10. [Solución de Problemas](#solución-de-problemas)
11. [Soporte y Contacto](#soporte-y-contacto)

---

## Introducción

**Confidens** es una plataforma avanzada de chat y análisis de documentos basada en inteligencia artificial. Permite a los usuarios interactuar con múltiples modelos de IA de última generación, procesar documentos PDF con tecnología RAG (Retrieval-Augmented Generation), y crear artefactos interactivos.

### Características Principales

- **Chat Inteligente**: Conversaciones contextuales con múltiples modelos de IA
- **Análisis de Documentos**: Procesamiento de PDFs con búsqueda semántica
- **Creación de Artefactos**: Generación de código, documentos y hojas de cálculo
- **Autenticación OAuth**: Login con Google y Microsoft
- **Arquitectura Moderna**: Next.js 15, React 19, TypeScript

---

## Arquitectura del Sistema

### Componentes Principales

```mermaid
graph TD
    Usuario[👤 Usuario]
    
    Frontend[🌐 Frontend Next.js]
    Backend[🔧 Backend FastAPI]
    
    IA[🤖 Modelos de IA]
    RAG[🧠 Sistema RAG]
    Auth[🔐 Autenticación]
    
    DB[💾 Supabase]
    Vector[🎯 Qdrant]
    
    Usuario --> Frontend
    Frontend --> Backend
    Frontend --> IA
    Backend --> RAG
    RAG --> Vector
    Auth --> DB
    
    classDef user fill:#1976D2,color:#fff
    classDef system fill:#4CAF50,color:#fff
    classDef data fill:#FF9800,color:#fff
    
    class Usuario user
    class Frontend,Backend,IA,RAG,Auth system
    class DB,Vector data
```

### Stack Tecnológico

**Frontend:**
- Next.js 15 con App Router
- React 19 con Server Components
- TypeScript con configuración estricta
- Tailwind CSS + shadcn/ui
- NextAuth para autenticación

**Backend:**
- FastAPI (Python) para APIs RAG
- Supabase como base de datos principal
- Qdrant para almacenamiento vectorial
- Voyage AI para embeddings

**IA y Procesamiento:**
- OpenAI (o4-mini, GPT-4.1)
- Google Gemini (2.5 Flash)
- XAI Grok (3 Mini)
- Voyage AI para embeddings

---

## Instalación y Configuración

### Requisitos Previos

- Node.js 20+
- Python 3.11+
- pnpm 9.x
- uv (gestor de paquetes Python)

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/xskuy/confidens-v2.git
cd confidens-v2
```

2. **Instalar dependencias**
```bash
# Dependencias Node.js
pnpm install

# Dependencias Python
cd lib/rag
uv venv
uv pip install -r requirements.txt
cd ../..
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

### Variables de Entorno Requeridas

```env
# Base de datos
POSTGRES_URL=postgresql://user:password@host:port/database
VECTOR_DATABASE_URL=postgresql://user:password@host:port/vector_db

# APIs de IA
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
XAI_API_KEY=xai-...
VOYAGE_API_KEY=pa-...

# Autenticación
NEXTAUTH_SECRET=tu_secret_aqui
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
MICROSOFT_ENTRA_ID_CLIENT_ID=tu_microsoft_client_id
MICROSOFT_ENTRA_ID_CLIENT_SECRET=tu_microsoft_client_secret

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=opcional_para_cloud

# FastAPI
RAG_API_URL=http://127.0.0.1:8000
```

### Configuración de Base de Datos

1. **Migrar base de datos principal**
```bash
pnpm db:migrate
```

2. **Migrar base de datos RAG**
```bash
pnpm db:migrate:rag
```

3. **Iniciar servicios**
```bash
# Desarrollo completo
./start-dev.sh

# Solo frontend
pnpm dev

# Solo backend RAG
cd lib/rag && uv run uvicorn api.main:app --reload
```

---

## Funcionalidades Principales

### 1. Chat Inteligente

**Descripción**: Sistema de chat con múltiples modelos de IA y tres niveles de potencia.

**Características**:
- **Rápido** (Gemini 2.5 Flash): Respuestas rápidas y consultas generales
- **Normal** (Grok 3 Mini): Equilibrio entre velocidad y profundidad
- **Avanzado** (OpenAI o4-mini): Máxima capacidad de razonamiento

**Uso**:
1. Acceder a la página principal (`/`)
2. Seleccionar nivel de potencia
3. Escribir mensaje y enviar
4. Ver respuesta en tiempo real

### 2. Sistema RAG (Análisis de Documentos)

**Descripción**: Procesamiento de documentos PDF con búsqueda semántica.

**Flujo de trabajo**:
1. **Subida**: El usuario sube un documento PDF
2. **Procesamiento**: 
   - Extracción de texto con OCR
   - Limpieza y estructuración
   - Creación de chunks semánticos
   - Enriquecimiento con contexto
3. **Indexación**: Generación de embeddings con Voyage AI
4. **Almacenamiento**: Guardado en Qdrant (vectores) y Supabase (metadatos)
5. **Consulta**: Búsqueda semántica y respuesta contextual

**APIs disponibles**:
- `POST /api/rag/documents/upload` - Subir documento
- `POST /api/rag/search` - Buscar en documentos
- `GET /api/rag/documents` - Listar documentos
- `DELETE /api/rag/documents/{id}` - Eliminar documento

### 3. Creación de Artefactos

**Descripción**: Generación de contenido interactivo en panel lateral.

**Tipos soportados**:
- **Código**: JavaScript, Python, React, scripts
- **Documentos**: Markdown, texto estructurado
- **Hojas de cálculo**: CSV, tablas, análisis de datos
- **Imágenes**: Generación y edición básica

**Características**:
- Edición en tiempo real
- Ejecución de código
- Exportación de contenido
- Historial de versiones

### 4. Autenticación OAuth

**Descripción**: Sistema de login con proveedores externos.

**Proveedores soportados**:
- Google (OAuth 2.0)
- Microsoft (Azure AD)

**Flujo de autenticación**:
1. Usuario hace clic en "Iniciar sesión"
2. Selecciona proveedor (Google/Microsoft)
3. Redirección a proveedor para autenticación
4. Verificación de identidad
5. Creación automática de usuario si no existe
6. Inicio de sesión exitoso

---

## Administración del Sistema

### Gestión de Usuarios

**Tabla de usuarios**: `User`
- `id`: UUID único
- `email`: Email del usuario
- `name`: Nombre completo
- `image`: URL de foto de perfil
- `createdAt`: Fecha de creación

**Operaciones comunes**:
```sql
-- Ver todos los usuarios
SELECT * FROM "User" ORDER BY "createdAt" DESC;

-- Buscar usuario por email
SELECT * FROM "User" WHERE email = 'usuario@ejemplo.com';

-- Eliminar usuario
DELETE FROM "User" WHERE id = 'uuid_del_usuario';
```

### Gestión de Documentos

**Tabla de documentos**: `resources`
- `id`: UUID del documento
- `title`: Título del documento
- `content`: Contenido procesado
- `metadata`: Información adicional
- `createdAt`: Fecha de subida

**Operaciones comunes**:
```sql
-- Ver documentos por usuario
SELECT * FROM resources WHERE "userId" = 'uuid_usuario';

-- Limpiar documentos antiguos
DELETE FROM resources WHERE "createdAt" < NOW() - INTERVAL '30 days';
```

### Monitoreo del Sistema

**Métricas importantes**:
- Uso de tokens por modelo de IA
- Documentos procesados por día
- Usuarios activos
- Tiempo de respuesta de APIs

**Logs del sistema**:
```bash
# Logs de Next.js
pnpm dev 2>&1 | tee logs/nextjs.log

# Logs de FastAPI
cd lib/rag && uv run uvicorn api.main:app --log-level info
```

---

## Integración con APIs

### OpenAI Integration

```typescript
import { openai } from '@ai-sdk/openai';

const model = openai('o4-mini', {
  reasoningEffort: 'high'
});
```

### Google Gemini Integration

```typescript
import { google } from '@ai-sdk/google';

const model = google('models/gemini-2.5-flash-preview-04-17', {
  thinkingConfig: {
    thinkingBudget: 2048
  }
});
```

### Voyage AI Integration

```python
from lib.rag.core.voyage_client import VoyageClient

client = VoyageClient(config)
embeddings = client.generate_document_embeddings(text)
```

### Qdrant Integration

```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")
points = client.search(
    collection_name="documents",
    query_vector=embedding,
    limit=5
)
```

---

## Seguridad y Autenticación

### Configuración de Seguridad

**NextAuth.js**:
- Sesiones JWT con expiración de 30 días
- Providers OAuth configurados
- Callbacks personalizados para manejo de usuarios

**Variables de entorno sensibles**:
```env
# Mantener seguras
NEXTAUTH_SECRET=cambiar_en_produccion
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_ENTRA_ID_CLIENT_SECRET=...
```

### Buenas Prácticas

1. **Rotar secrets regularmente**
2. **Usar HTTPS en producción**
3. **Configurar CORS apropiadamente**
4. **Validar inputs de usuario**
5. **Implementar rate limiting**

### Configuración OAuth

**Google Cloud Console**:
1. Crear proyecto
2. Habilitar Google+ API
3. Configurar OAuth consent screen
4. Crear credenciales OAuth 2.0
5. Agregar URLs de redirección

**Microsoft Azure AD**:
1. Registrar aplicación
2. Configurar redirect URIs
3. Generar client secret
4. Configurar permisos

---

## Costos y Presupuesto

### Costos por Categoría

**1. Modelos de IA** (Variable según uso)
- OpenAI: $3-30/millón tokens
- Google Gemini: $0.5-7/millón tokens
- XAI Grok: $5-10/millón tokens
- Voyage AI: $0.12/millón tokens

**2. Infraestructura** (Fija mensual)
- Supabase: $25-2000/mes
- Vercel: $0-150/mes
- Qdrant Cloud: $0-100/mes

**3. Servicios adicionales**
- Dominio: $10-50/año
- Hosting FastAPI: $20-200/mes
- Certificados SSL: Gratis (Let's Encrypt)

### Estimación de Costos

**Desarrollo/Testing**: $100-300/mes
**Producción pequeña** (100 usuarios): $200-500/mes
**Producción mediana** (1000 usuarios): $500-1500/mes
**Producción grande** (10000+ usuarios): $1500-5000+/mes

### Optimización de Costos

1. **Usar modelos apropiados** - Gemini para consultas simples
2. **Implementar caché** - Reducir llamadas repetitivas
3. **Monitorear uso** - Alertas por consumo excesivo
4. **Optimizar embeddings** - Procesar solo contenido relevante

---

## Mantenimiento

### Tareas Diarias

- [ ] Verificar estado de servicios
- [ ] Revisar logs de errores
- [ ] Monitorear uso de APIs
- [ ] Backup de base de datos

### Tareas Semanales

- [ ] Actualizar dependencias menores
- [ ] Limpiar documentos antiguos
- [ ] Revisar métricas de uso
- [ ] Pruebas de funcionalidad

### Tareas Mensuales

- [ ] Actualizar dependencias mayores
- [ ] Revisar costos y optimizar
- [ ] Backup completo del sistema
- [ ] Auditoría de seguridad

### Comandos Útiles

```bash
# Actualizar dependencias
pnpm update
uv pip list --outdated

# Limpiar base de datos
pnpm db:reset:rag  # Solo RAG
# Cuidado: esto elimina todos los datos

# Verificar estado del sistema
curl http://localhost:3000/api/health
curl http://localhost:8000/api/rag/health

# Backup de base de datos
pg_dump $POSTGRES_URL > backup_$(date +%Y%m%d).sql
```

---

## Solución de Problemas

### Problemas Comunes

**1. Error de conexión a base de datos**
```
Error: Database connection failed
```
**Solución**:
- Verificar `POSTGRES_URL` en `.env.local`
- Confirmar que Supabase esté accesible
- Revisar configuración de red/firewall

**2. FastAPI no responde**
```
Error: RAG API not responding
```
**Solución**:
- Verificar que el servidor FastAPI esté corriendo
- Revisar logs: `cd lib/rag && uv run uvicorn api.main:app --log-level debug`
- Verificar `RAG_API_URL` en configuración

**3. Modelos de IA no responden**
```
Error: OpenAI API key invalid
```
**Solución**:
- Verificar API keys en `.env.local`
- Confirmar que las keys no hayan expirado
- Revisar límites de rate limiting

**4. Documentos no se procesan**
```
Error: PDF processing failed
```
**Solución**:
- Verificar que el archivo sea un PDF válido
- Revisar logs de FastAPI
- Confirmar que Voyage AI esté funcionando

### Logs y Debugging

**Activar logs detallados**:
```bash
# Next.js
DEBUG=* pnpm dev

# FastAPI
cd lib/rag && uv run uvicorn api.main:app --log-level debug
```

**Ubicación de logs**:
- Next.js: stdout/stderr
- FastAPI: lib/rag/logs/
- Base de datos: Supabase dashboard

---

## Soporte y Contacto

### Documentación Adicional

- **README.md**: Guía de instalación rápida
- **AGENTS.md**: Guía para desarrolladores
- **OAUTH_SETUP.md**: Configuración de autenticación
- **RAG_API_DOCS.md**: Documentación de APIs RAG

### Recursos Útiles

- **Repositorio**: https://github.com/xskuy/confidens-v2
- **Issues**: https://github.com/xskuy/confidens-v2/issues
- **Documentación Next.js**: https://nextjs.org/docs
- **Documentación FastAPI**: https://fastapi.tiangolo.com

### Contacto

Para soporte técnico o consultas:
- Abrir un issue en GitHub
- Revisar documentación existente
- Consultar logs del sistema

---

## Apéndices

### A. Comandos de Desarrollo

```bash
# Instalación completa
pnpm install && cd lib/rag && uv venv && uv pip install -r requirements.txt

# Desarrollo
./start-dev.sh  # Inicia todo
pnpm dev        # Solo frontend
cd lib/rag && uv run uvicorn api.main:app --reload  # Solo backend

# Testing
pnpm test       # Pruebas e2e
pnpm lint       # Verificar código
pnpm format     # Formatear código

# Base de datos
pnpm db:migrate      # Migrar principal
pnpm db:migrate:rag  # Migrar RAG
pnpm db:studio       # Explorar BD
```

### B. Estructura de Archivos

```
confidens-v2/
├── app/                    # Páginas Next.js
├── components/             # Componentes UI
├── lib/                    # Librerías y utilidades
│   ├── ai/                 # Configuración de IA
│   ├── db/                 # Base de datos principal
│   └── rag/                # Sistema RAG
├── tests/                  # Pruebas e2e
├── public/                 # Archivos estáticos
├── .env.local              # Variables de entorno
├── package.json            # Dependencias Node.js
├── next.config.ts          # Configuración Next.js
└── tailwind.config.ts      # Configuración Tailwind
```

### C. Puertos y Servicios

- **3000**: Next.js frontend
- **8000**: FastAPI backend
- **5432**: PostgreSQL (Supabase)
- **6333**: Qdrant (vectores)

---

*Última actualización: Enero 2025*  
*Versión del sistema: 3.0.6* 