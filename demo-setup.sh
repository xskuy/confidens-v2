#!/bin/bash

# Script para demo rápida con ngrok
# Ejecutar: ./demo-setup.sh

echo "🚀 Configurando demo de Confidens v2..."
echo "====================================="

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar ngrok
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando ngrok...${NC}"
    
    # Detectar sistema operativo
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ngrok/ngrok/ngrok
        else
            echo -e "${RED}❌ Instala Homebrew primero: https://brew.sh${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
    else
        echo -e "${RED}❌ Descarga ngrok manualmente: https://ngrok.com/download${NC}"
        exit 1
    fi
fi

# Función de limpieza
cleanup() {
    echo -e "\n${RED}🛑 Deteniendo demo...${NC}"
    kill $SERVERS_PID $NGROK_PID 2>/dev/null
    wait $SERVERS_PID $NGROK_PID 2>/dev/null
    echo -e "${GREEN}✅ Demo detenida${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Verificar archivos .env
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Archivo .env.local no encontrado${NC}"
    echo -e "${BLUE}📝 Crea uno basado en .env.example${NC}"
fi

echo -e "${BLUE}🔧 Iniciando servidores locales...${NC}"

# Iniciar servidores en background
./start-dev.sh &
SERVERS_PID=$!

# Esperar a que los servidores se inicien
echo -e "${YELLOW}⏳ Esperando a que los servidores se inicien...${NC}"
sleep 10

# Verificar que Next.js esté corriendo
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Error: Next.js no está corriendo en puerto 3000${NC}"
    kill $SERVERS_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Servidores iniciados correctamente${NC}"
echo ""

# Iniciar ngrok para Next.js
echo -e "${BLUE}🌐 Creando túnel público con ngrok...${NC}"
ngrok http 3000 --log=stdout &
NGROK_PID=$!

# Esperar a que ngrok se inicie
sleep 5

# Obtener la URL pública de ngrok
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app')

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ No se pudo obtener la URL de ngrok${NC}"
    echo -e "${BLUE}💡 Revisa manualmente en: http://localhost:4040${NC}"
    NGROK_URL="http://localhost:4040"
fi

echo ""
echo -e "${GREEN}🎉 ¡Demo lista!${NC}"
echo "======================="
echo -e "🌐 ${BLUE}URL Pública:${NC}      $NGROK_URL"
echo -e "🏠 ${BLUE}Local:${NC}            http://localhost:3000"
echo -e "📊 ${BLUE}Panel ngrok:${NC}      http://localhost:4040"
echo -e "🐍 ${BLUE}FastAPI:${NC}          http://localhost:8000"
echo ""
echo -e "${YELLOW}💡 Comparte la URL pública para acceder desde cualquier lugar${NC}"
echo -e "${YELLOW}💡 La URL cambia cada vez que reinicias ngrok${NC}"
echo -e "${YELLOW}💡 Presiona Ctrl+C para detener la demo${NC}"
echo ""

# Mantener el script corriendo
wait $SERVERS_PID $NGROK_PID 