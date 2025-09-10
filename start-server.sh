#!/bin/bash

echo "🚀 Starting Invoice Management System Server..."

# Kill any existing processes on port 3001
echo "📋 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true

# Wait a moment for processes to clean up
sleep 2

# Start the backend server
echo "🔄 Starting backend server in background..."
cd /Users/apple/Documents/invois/backend

# Set environment variables and start server in background
export PORT=3001
export JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
export MONGODB_URI=mongodb://localhost:27017/invois
export GROQ_API_KEY=${GROQ_API_KEY:-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}

# Start server in background
nohup node server.js > server.log 2>&1 &

# Wait for server to start
sleep 3

# Check if server is running
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Backend server started successfully on http://localhost:3001"
    echo "📊 Server logs: tail -f /Users/apple/Documents/invois/backend/server.log"
    
    # Start frontend automatically
    echo "🎨 Starting frontend automatically..."
    cd /Users/apple/Documents/invois/frontend
    npm start
else
    echo "❌ Failed to start backend server"
    echo "📋 Check logs: cat /Users/apple/Documents/invois/backend/server.log"
fi
