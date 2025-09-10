#!/bin/bash

# ========================================
# APPLICATION SETUP SCRIPT
# ========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="invois-app"
APP_DIR="/var/www/${APP_NAME}"
BACKEND_PORT=3001
FRONTEND_PORT=3002

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

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory $APP_DIR not found!"
    print_status "Please upload your application code first."
    exit 1
fi

cd $APP_DIR

print_status "Setting up backend dependencies..."
cd backend
npm install --production

print_status "Setting up frontend dependencies..."
cd ../frontend
npm install
npm run build

print_status "Creating environment files..."

# Backend .env
cat > ../backend/.env << EOF
NODE_ENV=production
PORT=${BACKEND_PORT}
MONGODB_URI=mongodb://localhost:27017/invois_production
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=https://yourdomain.com
EOF

print_warning "Please update the .env file with your actual domain name!"
print_warning "Edit: $APP_DIR/backend/.env"

print_status "Creating PM2 ecosystem file..."
cat > ../ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'invois-backend',
      script: './backend/server.js',
      cwd: '$APP_DIR',
      env: {
        NODE_ENV: 'production',
        PORT: ${BACKEND_PORT}
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
      args: '-s build -l ${FRONTEND_PORT}',
      cwd: '$APP_DIR/frontend',
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

print_status "Installing serve for frontend..."
npm install -g serve

print_status "Creating PM2 log directory..."
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

print_status "Starting applications with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

print_success "Application setup completed!"
print_status "Your application should now be running on:"
echo "  - Frontend: http://yourdomain.com"
echo "  - Backend API: http://yourdomain.com/api"
echo ""
print_status "PM2 Commands:"
echo "  pm2 status          - Check application status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart all applications"
echo "  pm2 stop all        - Stop all applications"
echo ""
print_warning "Don't forget to:"
echo "1. Update the .env file with your actual domain"
echo "2. Update the frontend API configuration"
echo "3. Test the application"
