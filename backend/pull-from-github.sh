#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Pulling changes from GitHub to VPS...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📦 Initializing git repository...${NC}"
    git init
    git remote add origin https://github.com/fadhli17/invois.git
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${CURRENT_BRANCH}${NC}"

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes from GitHub...${NC}"
git pull origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pulled changes from GitHub${NC}"
else
    echo -e "${RED}❌ Failed to pull changes from GitHub${NC}"
    exit 1
fi

# Install/update dependencies
echo -e "${YELLOW}📦 Installing/updating dependencies...${NC}"

# Backend dependencies
echo -e "${BLUE}🔧 Installing backend dependencies...${NC}"
cd backend
if [ -f "package.json" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No package.json found in backend directory${NC}"
fi

# Frontend dependencies
echo -e "${BLUE}🎨 Installing frontend dependencies...${NC}"
cd ../frontend
if [ -f "package.json" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No package.json found in frontend directory${NC}"
fi

cd ..

# Create SuperAdmin if it doesn't exist
echo -e "${BLUE}👤 Checking SuperAdmin account...${NC}"
cd backend
if [ -f "scripts/createSuperAdmin.js" ]; then
    node scripts/createSuperAdmin.js
    echo -e "${GREEN}✅ SuperAdmin account checked/created${NC}"
else
    echo -e "${YELLOW}⚠️  SuperAdmin creation script not found${NC}"
fi

cd ..

# Set proper permissions
echo -e "${YELLOW}🔐 Setting proper permissions...${NC}"
chmod +x start-all.sh
chmod +x pull-from-github.sh
chmod +x push-to-github.sh

# Show status
echo -e "${GREEN}🎉 Pull from GitHub completed successfully!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "   1. Start the system: ${YELLOW}./start-all.sh${NC}"
echo -e "   2. Access SuperAdmin: ${YELLOW}http://your-vps-ip:3000/superadmin/login${NC}"
echo -e "   3. Login with: ${YELLOW}superadmin / SuperAdmin123!${NC}"
echo ""
echo -e "${GREEN}✅ All done! Your VPS is now up to date with GitHub.${NC}"
