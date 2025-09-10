#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping Invoice Management System...${NC}"

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local service_name=$2
    
    if lsof -ti:$port >/dev/null 2>&1; then
        echo -e "${YELLOW}🔍 Stopping $service_name on port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ $service_name stopped${NC}"
    else
        echo -e "${YELLOW}ℹ️  $service_name not running on port $port${NC}"
    fi
}

# Kill processes by name
kill_process() {
    local process_name=$1
    local service_name=$2
    
    if pgrep -f "$process_name" >/dev/null 2>&1; then
        echo -e "${YELLOW}🔍 Stopping $service_name...${NC}"
        pkill -f "$process_name" 2>/dev/null || true
        sleep 1
        # Force kill if still running
        pkill -9 -f "$process_name" 2>/dev/null || true
        echo -e "${GREEN}✅ $service_name stopped${NC}"
    else
        echo -e "${YELLOW}ℹ️  $service_name not running${NC}"
    fi
}

# Stop services
kill_port 3000 "Frontend Server"
kill_port 3001 "Backend Server"
kill_process "node.*server.js" "Backend Node Process"
kill_process "react-scripts" "Frontend React Process"

# Wait a moment for processes to fully terminate
sleep 2

# Check if any processes are still running
echo -e "${YELLOW}🔍 Checking for remaining processes...${NC}"

if lsof -ti:3000 >/dev/null 2>&1 || lsof -ti:3001 >/dev/null 2>&1; then
    echo -e "${RED}⚠️  Some processes may still be running. Force killing...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    pkill -9 -f "node.*server.js" 2>/dev/null || true
    pkill -9 -f "react-scripts" 2>/dev/null || true
fi

echo -e "${GREEN}✅ All services stopped successfully!${NC}"
echo -e "${BLUE}💡 To start services again, run: ./start-all.sh${NC}"
