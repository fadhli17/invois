#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Invoice Management System Status${NC}"
echo "=================================="

# Function to check service status
check_service() {
    local url=$1
    local service_name=$2
    local port=$3
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name (Port $port) - Running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name (Port $port) - Not Running${NC}"
        return 1
    fi
}

# Check MongoDB
echo -e "${YELLOW}🔍 Checking MongoDB...${NC}"
if nc -z localhost 27017 2>/dev/null; then
    echo -e "${GREEN}✅ MongoDB (Port 27017) - Running${NC}"
else
    echo -e "${RED}❌ MongoDB (Port 27017) - Not Running${NC}"
fi

# Check Backend
echo -e "${YELLOW}🔍 Checking Backend...${NC}"
if check_service "http://localhost:3001" "Backend Server" "3001"; then
    # Test specific endpoints
    echo -e "${YELLOW}  🔍 Testing endpoints...${NC}"
    
    # Test root endpoint
    if curl -s http://localhost:3001 | grep -q "Invoice Management System"; then
        echo -e "${GREEN}    ✅ Root endpoint (/)" "${NC}"
    else
        echo -e "${RED}    ❌ Root endpoint (/)" "${NC}"
    fi
    
    # Test auth endpoint
    if curl -s http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"test":"test"}' | grep -q "Username atau password salah"; then
        echo -e "${GREEN}    ✅ Auth endpoint (/api/auth/login)" "${NC}"
    else
        echo -e "${RED}    ❌ Auth endpoint (/api/auth/login)" "${NC}"
    fi
    
    # Test users endpoint (should return 401 without auth)
    if curl -s http://localhost:3001/api/users/profile | grep -q "Token is not valid"; then
        echo -e "${GREEN}    ✅ Users endpoint (/api/users/profile)" "${NC}"
    else
        echo -e "${RED}    ❌ Users endpoint (/api/users/profile)" "${NC}"
    fi
fi

# Check Frontend
echo -e "${YELLOW}🔍 Checking Frontend...${NC}"
check_service "http://localhost:3000" "Frontend Server" "3000"

echo ""
echo -e "${BLUE}📋 Process Information:${NC}"

# Show running processes
echo -e "${YELLOW}🔍 Node.js processes:${NC}"
ps aux | grep -E "(node.*server\.js|react-scripts)" | grep -v grep || echo -e "${RED}  No Node.js processes found${NC}"

echo -e "${YELLOW}🔍 Port usage:${NC}"
lsof -i :3000 -i :3001 -i :27017 2>/dev/null || echo -e "${RED}  No processes found on monitored ports${NC}"

echo ""
echo -e "${BLUE}💡 Commands:${NC}"
echo -e "${YELLOW}  Start all: ./start-all.sh${NC}"
echo -e "${YELLOW}  Stop all:  ./stop-all.sh${NC}"
echo -e "${YELLOW}  View logs: tail -f backend/server.log${NC}"
