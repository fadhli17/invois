#!/bin/bash

# ========================================
# QUICK DEPLOYMENT SCRIPT
# ========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get user input
echo "🚀 Quick Deployment Setup for Invoice Application"
echo "=================================================="
echo ""

read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN_NAME
read -p "Enter your VPS IP address: " VPS_IP
read -p "Enter your VPS username: " VPS_USER

if [ -z "$DOMAIN_NAME" ] || [ -z "$VPS_IP" ] || [ -z "$VPS_USER" ]; then
    print_error "All fields are required!"
    exit 1
fi

print_status "Creating deployment package..."

# Create deployment package
mkdir -p deployment-package
cp -r backend deployment-package/
cp -r frontend deployment-package/
cp -r scripts deployment-package/ 2>/dev/null || true
cp package*.json deployment-package/ 2>/dev/null || true
cp README.md deployment-package/ 2>/dev/null || true

# Create production environment file
cat > deployment-package/backend/.env << EOF
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/invois_production
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=https://${DOMAIN_NAME}
EOF

# Create PM2 ecosystem file
cat > deployment-package/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'invois-backend',
      script: './backend/server.js',
      cwd: '/var/www/invois-app',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/invois-backend-error.log',
      out_file: '/var/log/pm2/invois-backend-out.log',
      log_file: '/var/log/pm2/invois-backend.log'
    },
    {
      name: 'invois-frontend',
      script: 'serve',
      args: '-s build -l 3002',
      cwd: '/var/www/invois-app/frontend',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/invois-frontend-error.log',
      out_file: '/var/log/pm2/invois-frontend-out.log',
      log_file: '/var/log/pm2/invois-frontend.log'
    }
  ]
};
EOF

# Create Nginx configuration
cat > deployment-package/nginx-config << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};

    # Frontend (React)
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # File uploads
    location /uploads/ {
        proxy_pass http://localhost:3001/uploads/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Create setup script for VPS
cat > deployment-package/setup-vps.sh << 'EOF'
#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Setting up Invoice Application on VPS..."

# Install dependencies
print_status "Installing Node.js dependencies..."
cd backend && npm install --production
cd ../frontend && npm install && npm run build

# Install serve globally
print_status "Installing serve..."
npm install -g serve

# Create PM2 log directory
print_status "Creating PM2 log directory..."
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Start applications
print_status "Starting applications with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

print_success "Application setup completed!"
print_status "Check status with: pm2 status"
print_status "View logs with: pm2 logs"
EOF

chmod +x deployment-package/setup-vps.sh

# Create archive
print_status "Creating deployment archive..."
tar -czf invois-deployment.tar.gz deployment-package/

print_success "Deployment package created: invois-deployment.tar.gz"
echo ""
print_status "Next steps:"
echo "1. Upload the archive to your VPS:"
echo "   scp invois-deployment.tar.gz ${VPS_USER}@${VPS_IP}:/home/${VPS_USER}/"
echo ""
echo "2. Connect to your VPS:"
echo "   ssh ${VPS_USER}@${VPS_IP}"
echo ""
echo "3. Extract and setup:"
echo "   tar -xzf invois-deployment.tar.gz"
echo "   sudo mv deployment-package /var/www/invois-app"
echo "   cd /var/www/invois-app"
echo "   chmod +x setup-vps.sh"
echo "   ./setup-vps.sh"
echo ""
echo "4. Setup Nginx:"
echo "   sudo cp nginx-config /etc/nginx/sites-available/invois-app"
echo "   sudo ln -sf /etc/nginx/sites-available/invois-app /etc/nginx/sites-enabled/"
echo "   sudo rm -f /etc/nginx/sites-enabled/default"
echo "   sudo nginx -t"
echo "   sudo systemctl restart nginx"
echo ""
echo "5. Setup SSL:"
echo "   sudo certbot --nginx -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME}"
echo ""
print_warning "Make sure your domain ${DOMAIN_NAME} points to ${VPS_IP} before setting up SSL!"

# Cleanup
rm -rf deployment-package

print_success "Deployment package ready! 🚀"
