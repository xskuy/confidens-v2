#!/bin/bash

# Script para iniciar Next.js y FastAPI en paralelo para desarrollo

echo "🚀 Iniciando servidores de desarrollo..."
echo "================================="

# Colores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para limpiar procesos al salir
cleanup() {
    echo -e "\n${RED}🛑 Deteniendo servidores...${NC}"
    kill $NEXTJS_PID $FASTAPI_PID 2>/dev/null
    wait $NEXTJS_PID $FASTAPI_PID 2>/dev/null
    echo -e "${GREEN}✅ Servidores detenidos${NC}"
    exit 0
}

# Capturar Ctrl+C para limpiar procesos
trap cleanup SIGINT SIGTERM

# Verificar que uv está instalado
if ! command -v uv &> /dev/null; then
    echo -e "${RED}❌ Error: uv no está instalado. Instálalo con: curl -LsSf https://astral.sh/uv/install.sh | sh${NC}"
    exit 1
fi

# Verificar que pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ Error: pnpm no está instalado${NC}"
    exit 1
fi

# Configurar entorno Python
echo -e "${BLUE}🔍 Configurando entorno Python...${NC}"
cd rag-python

# Crear entorno virtual si no existe
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}📦 Creando entorno virtual...${NC}"
    uv venv
fi

# Verificar/instalar dependencias
echo -e "${YELLOW}📦 Instalando dependencias de Python...${NC}"
uv pip install -r requirements.txt

cd ..

echo -e "${GREEN}✅ Dependencias verificadas${NC}"
echo ""

# Iniciar FastAPI en background
echo -e "${BLUE}🐍 Iniciando servidor FastAPI (Puerto 8000)...${NC}"
cd rag-python
source .venv/bin/activate && python scripts/main_server.py &
FASTAPI_PID=$!
cd ..

# Esperar un poco para que FastAPI se inicie
sleep 3

# Verificar que FastAPI esté corriendo
if ps -p $FASTAPI_PID > /dev/null; then
    echo -e "${GREEN}✅ FastAPI iniciado (PID: $FASTAPI_PID)${NC}"
else
    echo -e "${RED}❌ Error: FastAPI no se pudo iniciar${NC}"
    exit 1
fi

# Iniciar Next.js en background
echo -e "${BLUE}⚡ Iniciando servidor Next.js (Puerto 3000)...${NC}"
pnpm dev &
NEXTJS_PID=$!

# Esperar un poco para que Next.js se inicie
sleep 3

# Verificar que Next.js esté corriendo
if ps -p $NEXTJS_PID > /dev/null; then
    echo -e "${GREEN}✅ Next.js iniciado (PID: $NEXTJS_PID)${NC}"
else
    echo -e "${RED}❌ Error: Next.js no se pudo iniciar${NC}"
    kill $FASTAPI_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 ¡Servidores iniciados exitosamente!${NC}"
echo "================================="
echo -e "📱 ${BLUE}Next.js App:${NC}      http://localhost:3000"
echo -e "🐍 ${BLUE}FastAPI Server:${NC}   http://localhost:8000"
echo -e "📖 ${BLUE}API Docs:${NC}         http://localhost:8000/docs"
echo -e "🧪 ${BLUE}Prueba de RAG:${NC}    http://localhost:3000/rag-test"
echo ""
echo -e "${YELLOW}💡 Presiona Ctrl+C para detener ambos servidores${NC}"
echo ""

# Esperar a que los procesos terminen
wait $NEXTJS_PID $FASTAPI_PID 