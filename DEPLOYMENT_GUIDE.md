# 🚀 Panduan Deployment Aplikasi Invois ke VPS

## 📋 Prerequisites

### 1. VPS Requirements

- **OS**: Ubuntu 20.04 LTS atau lebih baru
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB
- **CPU**: 1 core minimum (2 cores recommended)

### 2. Domain Name

- Domain yang sudah diarahkan ke IP VPS anda
- Contoh: `yourdomain.com`

## 🔧 Step 1: Persiapan VPS

### 1.1 Connect ke VPS

```bash
ssh user@your-vps-ip
```

### 1.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Essential Packages

```bash
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw
```

## 🐳 Step 2: Install Dependencies

### 2.1 Install Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2.2 Install PM2

```bash
sudo npm install -g pm2
```

### 2.3 Install MongoDB

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2.4 Install Serve (untuk frontend)

```bash
sudo npm install -g serve
```

## 🔒 Step 3: Setup Firewall

```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

## 📁 Step 4: Upload Aplikasi

### 4.1 Create App Directory

```bash
sudo mkdir -p /var/www/invois-app
sudo chown -R $USER:$USER /var/www/invois-app
```

### 4.2 Upload Code (Pilih salah satu)

#### Option A: Upload dari Local

```bash
# Dari komputer local anda
scp -r ./invois user@your-vps-ip:/var/www/invois-app/
```

#### Option B: Clone dari Git (jika ada repository)

```bash
cd /var/www/invois-app
git clone https://github.com/yourusername/invois.git .
```

#### Option C: Upload Manual

```bash
# Upload file zip ke VPS, kemudian extract
cd /var/www/invois-app
unzip invois.zip
```

## ⚙️ Step 5: Setup Aplikasi

### 5.1 Install Dependencies

```bash
cd /var/www/invois-app

# Backend dependencies
cd backend
npm install --production

# Frontend dependencies
cd ../frontend
npm install
npm run build
```

### 5.2 Create Environment File

```bash
cd /var/www/invois-app/backend
nano .env
```

Isi dengan:

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/invois_production
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=https://yourdomain.com
```

**Ganti `yourdomain.com` dengan domain anda yang sebenar!**

### 5.3 Create PM2 Configuration

```bash
cd /var/www/invois-app
nano ecosystem.config.js
```

Isi dengan:

```javascript
module.exports = {
  apps: [
    {
      name: "invois-backend",
      script: "./backend/server.js",
      cwd: "/var/www/invois-app",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/invois-backend-error.log",
      out_file: "/var/log/pm2/invois-backend-out.log",
      log_file: "/var/log/pm2/invois-backend.log",
    },
    {
      name: "invois-frontend",
      script: "serve",
      args: "-s build -l 3002",
      cwd: "/var/www/invois-app/frontend",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      error_file: "/var/log/pm2/invois-frontend-error.log",
      out_file: "/var/log/pm2/invois-frontend-out.log",
      log_file: "/var/log/pm2/invois-frontend.log",
    },
  ],
};
```

## 🌐 Step 6: Setup Nginx

### 6.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/invois-app
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React)
    location / {
        proxy_pass http://localhost:3002;
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
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads/ {
        proxy_pass http://localhost:3001/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Ganti `yourdomain.com` dengan domain anda yang sebenar!**

### 6.2 Enable Site

```bash
sudo ln -sf /etc/nginx/sites-available/invois-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 🔐 Step 7: Setup SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Ganti `yourdomain.com` dengan domain anda yang sebenar!**

## 🚀 Step 8: Start Aplikasi

### 8.1 Create PM2 Log Directory

```bash
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

### 8.2 Start Applications

```bash
cd /var/www/invois-app
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 8.3 Check Status

```bash
pm2 status
pm2 logs
```

## ✅ Step 9: Testing

### 9.1 Test Frontend

Buka browser dan akses: `https://yourdomain.com`

### 9.2 Test API

```bash
curl https://yourdomain.com/api/invoices
```

### 9.3 Test File Uploads

```bash
curl https://yourdomain.com/uploads/
```

## 🔧 Management Commands

### PM2 Commands

```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all         # Restart all apps
pm2 stop all            # Stop all apps
pm2 reload all          # Reload all apps
pm2 monit               # Monitor dashboard
```

### Nginx Commands

```bash
sudo nginx -t           # Test configuration
sudo systemctl restart nginx    # Restart nginx
sudo systemctl status nginx     # Check status
```

### MongoDB Commands

```bash
sudo systemctl status mongod    # Check status
sudo systemctl restart mongod   # Restart MongoDB
mongo                          # Connect to MongoDB
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Application Not Starting

```bash
pm2 logs invois-backend
pm2 logs invois-frontend
```

#### 2. Nginx 502 Error

- Check if applications are running: `pm2 status`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

#### 3. SSL Certificate Issues

```bash
sudo certbot renew --dry-run
```

#### 4. MongoDB Connection Issues

```bash
sudo systemctl status mongod
mongo --eval "db.adminCommand('ismaster')"
```

### Log Locations

- **PM2 Logs**: `/var/log/pm2/`
- **Nginx Logs**: `/var/log/nginx/`
- **MongoDB Logs**: `/var/log/mongodb/`

## 🔄 Updates & Maintenance

### Update Application

```bash
cd /var/www/invois-app
git pull origin main  # If using Git
# Or upload new files manually

# Restart applications
pm2 restart all
```

### Backup Database

```bash
mongodump --db invois_production --out /backup/$(date +%Y%m%d)
```

### Monitor Resources

```bash
htop                    # System resources
pm2 monit              # Application monitoring
df -h                  # Disk usage
```

## 📞 Support

Jika ada masalah, check:

1. PM2 logs: `pm2 logs`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. System logs: `sudo journalctl -u nginx`

---

**Selamat! Aplikasi Invois anda sudah berjaya di-deploy ke VPS! 🎉**
