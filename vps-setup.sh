#!/bin/bash

# ========================================
# VPS SETUP SCRIPT
# ========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Invoice Management System on VPS...${NC}"

# VPS IP
VPS_IP="98.88.17.102"

# Update system packages
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    echo -e "${BLUE}�� Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}✅ Node.js already installed${NC}"
fi

# Install MongoDB (if not already installed)
if ! command -v mongod &> /dev/null; then
    echo -e "${BLUE}📥 Installing MongoDB...${NC}"
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
else
    echo -e "${GREEN}✅ MongoDB already installed${NC}"
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo -e "${BLUE}�� Installing PM2...${NC}"
    sudo npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

# Install Git (if not already installed)
if ! command -v git &> /dev/null; then
    echo -e "${BLUE}�� Installing Git...${NC}"
    sudo apt install -y git
else
    echo -e "${GREEN}✅ Git already installed${NC}"
fi

# Install Nginx (if not already installed)
if ! command -v nginx &> /dev/null; then
    echo -e "${BLUE}📥 Installing Nginx...${NC}"
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    echo -e "${GREEN}✅ Nginx already installed${NC}"
fi

# Install UFW firewall
if ! command -v ufw &> /dev/null; then
    echo -e "${BLUE}�� Installing UFW firewall...${NC}"
    sudo apt install -y ufw
    sudo ufw allow ssh
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw allow 3000
    sudo ufw allow 9000
    sudo ufw --force enable
else
    echo -e "${GREEN}✅ UFW already installed${NC}"
fi

# Create project directory
PROJECT_DIR="/var/www/invois"
echo -e "${BLUE}📁 Creating project directory: ${PROJECT_DIR}${NC}"
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Clone repository (if not already exists)
if [ ! -d "$PROJECT_DIR/.git" ]; then
    echo -e "${BLUE}📥 Cloning repository...${NC}"
    cd $PROJECT_DIR
    git clone https://github.com/fadhli17/invois.git .
else
    echo -e "${GREEN}✅ Repository already exists${NC}"
    cd $PROJECT_DIR
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing project dependencies...${NC}"
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Build frontend
echo -e "${YELLOW}🔨 Building frontend...${NC}"
cd frontend && npm run build && cd ..

# Create SuperAdmin account
echo -e "${BLUE}👤 Creating SuperAdmin account...${NC}"
cd backend && node scripts/createSuperAdmin.js && cd ..

# Create PM2 ecosystem file
echo -e "${BLUE}⚙️  Creating PM2 ecosystem file...${NC}"
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [
    {
      name: 'invois-backend',
      script: './backend/server.js',
      cwd: '/var/www/invois',
      mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 9000,
        JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
        MONGODB_URI: 'mongodb://localhost:27017/invois',
        GROQ_API_KEY: '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'
      }
    },
    {
      name: 'invois-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/invois/frontend',
      mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
PM2EOF

# Start applications with PM2
echo -e "${BLUE}🚀 Starting applications with PM2...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Create Nginx configuration
echo -e "${BLUE}⚙️  Creating Nginx configuration...${NC}"
sudo tee /etc/nginx/sites-available/invois << 'NGINXEOF'
server {
    listen 80;
    server_name 98.88.17.102;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/invois /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo -e "${GREEN}🎉 VPS setup completed successfully!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "   1. Check application status: ${YELLOW}pm2 status${NC}"
echo -e "   2. View logs: ${YELLOW}pm2 logs${NC}"
echo -e "   3. Access your application: ${YELLOW}http://98.88.17.102${NC}"
echo -e "   4. SuperAdmin login: ${YELLOW}http://98.88.17.102/superadmin/login${NC}"
echo ""
echo -e "${GREEN}✅ Your Invoice Management System is now running on VPS!${NC}"