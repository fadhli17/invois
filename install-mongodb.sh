#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📥 Installing MongoDB with alternative method...${NC}"

# Method 1: Try to install libssl1.1 from different sources
echo -e "${YELLOW}🔧 Trying alternative libssl1.1 sources...${NC}"

# Try different Ubuntu versions
wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2.21_amd64.deb || \
wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2.20_amd64.deb || \
wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2.19_amd64.deb

# Install libssl1.1
sudo dpkg -i libssl1.1_*.deb
sudo apt-get install -f

# Method 2: Install MongoDB 5.0 instead (more compatible)
echo -e "${YELLOW}�� Installing MongoDB 5.0 (more compatible)...${NC}"
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

echo -e "${GREEN}✅ MongoDB installation completed!${NC}"