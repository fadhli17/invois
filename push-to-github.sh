#!/bin/bash

# Script untuk push kod aplikasi invois ke GitHub
# Repository: https://github.com/fadhli17/invois.git

echo "🚀 Memulakan proses push ke GitHub..."
echo "📁 Working directory: $(pwd)"

# Check if we're in the right directory
if [ ! -f "backend/server.js" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Sila jalankan script ini dari root directory aplikasi invois"
    echo "   Pastikan anda berada di /Users/apple/Documents/invois"
    exit 1
fi

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
else
    echo "✅ Git repository sudah ada"
fi

# Add remote if not exists
if ! git remote | grep -q origin; then
    echo "🔗 Adding remote repository..."
    git remote add origin https://github.com/fadhli17/invois.git
    echo "✅ Remote repository ditambah: https://github.com/fadhli17/invois.git"
else
    echo "✅ Remote repository sudah ada"
fi

# Create .gitignore if not exists
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
frontend/build/
backend/dist/

# Logs
logs/
*.log
server.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory
coverage/
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
tmp/
temp/

# Uploads directory
uploads/
public/uploads/

# Database files
*.db
*.sqlite
*.sqlite3

# PM2 files
ecosystem.config.js

# Backup files
*.backup
*.bak

# Local development files
.env.example
EOF
    echo "✅ .gitignore file created"
else
    echo "✅ .gitignore file sudah ada"
fi

# Check git status
echo "📊 Checking git status..."
git status

# Add all files
echo "📁 Adding files to git..."
git add .

# Check what files are staged
echo "📋 Files yang akan di-commit:"
git status --porcelain

# Commit changes
echo "💾 Committing changes..."
git commit -m "🚀 Update: Invoice Management System dengan Discount Functionality

✨ Features:
- ✅ Discount functionality (RM dan %)
- ✅ Payment tracking system
- ✅ Freeform dan structured item modes
- ✅ Collapsible sections (Document Mode Stats & Overdue Alert)
- ✅ Enhanced UI/UX design
- ✅ Database schema updated
- ✅ Backend API improvements
- ✅ Frontend form enhancements

🔧 Technical Updates:
- Added discount fields to MongoDB model
- Updated backend routes for discount handling
- Enhanced calculation functions
- Improved error handling
- Better user experience

📱 UI Improvements:
- Minimalistic sidebar design
- Professional payment record display
- Responsive design enhancements
- Better mobile experience"

# Set main branch
echo "🌿 Setting main branch..."
git branch -M main

# Push to GitHub
echo "🚀 Pushing to GitHub..."
echo "   Repository: https://github.com/fadhli17/invois.git"
echo "   Branch: main"

# Try to push
if git push -u origin main; then
    echo ""
    echo "🎉 SUCCESS! Kod berjaya di-push ke GitHub!"
    echo ""
    echo "📋 Summary:"
    echo "   ✅ Repository: https://github.com/fadhli17/invois"
    echo "   ✅ Branch: main"
    echo "   ✅ Files: Semua files aplikasi invois"
    echo "   ✅ .gitignore: Configured untuk exclude node_modules, logs, dll"
    echo ""
    echo "🔗 Link Repository: https://github.com/fadhli17/invois"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Buka https://github.com/fadhli17/invois untuk verify"
    echo "   2. Check semua files ada di repository"
    echo "   3. Untuk update masa depan, jalankan script ini lagi"
    echo ""
else
    echo ""
    echo "❌ Error: Gagal push ke GitHub"
    echo ""
    echo "🔧 Possible solutions:"
    echo "   1. Check internet connection"
    echo "   2. Verify GitHub credentials"
    echo "   3. Check if repository exists: https://github.com/fadhli17/invois"
    echo "   4. Try manual push: git push -u origin main"
    echo ""
    echo "💡 Untuk authentication, anda mungkin perlu:"
    echo "   - Username: fadhli17"
    echo "   - Password: Personal Access Token (bukan password GitHub)"
    echo "   - Create token di: https://github.com/settings/tokens"
    echo ""
fi

echo "🏁 Script completed!"
