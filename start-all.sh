#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Complete Invoice Management System...${NC}"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        echo -e "${YELLOW}   Attempt $attempt/$max_attempts - waiting...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Kill any existing processes
echo -e "${YELLOW}📋 Cleaning up existing processes...${NC}"
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true

sleep 3

# Check if MongoDB is running
echo -e "${YELLOW}🔍 Checking MongoDB connection...${NC}"
if ! nc -z localhost 27017 2>/dev/null; then
    echo -e "${RED}❌ MongoDB is not running. Please start MongoDB first.${NC}"
    echo -e "${YELLOW}   You can start MongoDB with: brew services start mongodb-community${NC}"
    exit 1
fi
echo -e "${GREEN}✅ MongoDB is running${NC}"

# Check if backend dependencies are installed
echo -e "${YELLOW}📦 Checking backend dependencies...${NC}"
cd /Users/jon/Documents/invois/backend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Installing backend dependencies...${NC}"
    npm install
fi

# Start backend server in background
echo -e "${BLUE}🔄 Starting backend server...${NC}"

export PORT=3001
export JWT_SECRET=your-super-secret-jwt-key-change-this-in-production  
export MONGODB_URI=mongodb://localhost:27017/invois
export GROQ_API_KEY=${GROQ_API_KEY:-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}

# Start server and capture PID
nohup node server.js > server.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
if wait_for_service "http://localhost:3001" "Backend Server"; then
    echo -e "${GREEN}✅ Backend server running on http://localhost:3001${NC}"
    
    # Test specific endpoints
    echo -e "${YELLOW}🔍 Testing backend endpoints...${NC}"
    
    # Test root endpoint
    if curl -s http://localhost:3001 | grep -q "Invoice Management System"; then
        echo -e "${GREEN}  ✅ Root endpoint working${NC}"
    else
        echo -e "${RED}  ❌ Root endpoint failed${NC}"
    fi
    
    # Test auth endpoint
    if curl -s http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"test":"test"}' | grep -q "Username atau password salah"; then
        echo -e "${GREEN}  ✅ Auth endpoint working${NC}"
    else
        echo -e "${RED}  ❌ Auth endpoint failed${NC}"
    fi
    
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo -e "${YELLOW}📋 Backend logs:${NC}"
    tail -20 server.log
    exit 1
fi

# Check if frontend dependencies are installed
echo -e "${YELLOW}📦 Checking frontend dependencies...${NC}"
cd /Users/jon/Documents/invois/frontend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Installing frontend dependencies...${NC}"
    npm install
fi

# Start frontend
echo -e "${BLUE}🎨 Starting frontend server...${NC}"
echo -e "${GREEN}🌐 Frontend will be available at http://localhost:3000${NC}"
echo -e "${GREEN}🔗 Backend API available at http://localhost:3001${NC}"
echo -e "${YELLOW}📝 Backend logs: tail -f /Users/jon/Documents/invois/backend/server.log${NC}"
echo -e "${YELLOW}🛑 To stop all services: pkill -f 'node.*server.js' && pkill -f 'react-scripts'${NC}"
echo ""

# Start frontend (this will block)
npm start