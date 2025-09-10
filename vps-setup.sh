#!/bin/bash

# ========================================
# VPS SETUP SCRIPT
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

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Use a regular user with sudo privileges."
    exit 1
fi

print_status "🚀 Setting up VPS for Invoice Application..."

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw

# Install Node.js 18
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
print_status "Installing PM2..."
sudo npm install -g pm2

# Install MongoDB
print_status "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install serve
print_status "Installing serve..."
sudo npm install -g serve

# Setup firewall
print_status "Setting up firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /var/www/invois-app
sudo chown -R $USER:$USER /var/www/invois-app

# Create PM2 log directory
print_status "Creating PM2 log directory..."
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

print_success "VPS setup completed!"
print_status "Next steps:"
echo "1. Upload your application code to /var/www/invois-app"
echo "2. Run the application setup script"
echo "3. Configure Nginx and SSL"
echo ""
echo "To upload your code:"
echo "  scp -r ./invois user@your-server:/var/www/invois-app/"
echo ""
echo "Or use the quick-deploy.sh script from your local machine."
