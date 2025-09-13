#!/bin/bash

# Pull to VPS Script
# Usage: ./pull-to-vps.sh [vps-username] [vps-ip] [project-path]

VPS_USER=${1:-"root"}
VPS_IP=${2:-"your-vps-ip"}
PROJECT_PATH=${3:-"/var/www/invois"}

echo "🚀 Pulling code to VPS..."
echo "VPS: $VPS_USER@$VPS_IP"
echo "Path: $PROJECT_PATH"
echo ""

# SSH command to pull code
ssh $VPS_USER@$VPS_IP << EOF
    echo "📁 Navigating to project directory..."
    cd $PROJECT_PATH
    
    echo "📊 Checking git status..."
    git status
    
    echo "🔄 Pulling latest changes..."
    git pull origin main
    
    echo "📦 Installing dependencies..."
    cd backend && npm install
    cd ../frontend && npm install
    
    echo "🔄 Restarting services..."
    pm2 restart all || echo "PM2 not found, manual restart needed"
    
    echo "✅ Pull completed successfully!"
EOF

echo ""
echo "🎉 Code pulled to VPS successfully!"
echo "🌐 Your app should be updated at: http://$VPS_IP"
