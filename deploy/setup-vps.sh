#!/bin/bash
# ============================================================
# Shan Koe Mee - VPS Deployment Script
# Run this on your fresh DigitalOcean Ubuntu 22.04/24.04 VPS
# Usage: bash setup-vps.sh
# ============================================================

set -e

echo "============================================"
echo "  Shan Koe Mee - Server Setup"
echo "============================================"

# ----- 1. System Update -----
echo "[1/7] Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# ----- 2. Install Node.js 18.x -----
echo "[2/7] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# ----- 3. Install PM2 (Process Manager) -----
echo "[3/7] Installing PM2..."
sudo npm install -g pm2

# ----- 4. Install Nginx -----
echo "[4/7] Installing Nginx..."
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# ----- 5. Install UFW Firewall -----
echo "[5/7] Configuring firewall..."
sudo apt-get install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# ----- 6. Setup Project Directory -----
echo "[6/7] Setting up project directory..."
sudo mkdir -p /var/www/shankoemee/ShanServer
sudo mkdir -p /var/www/shankoemee/webgl
sudo chown -R $USER:$USER /var/www/shankoemee

# ----- 7. Install Server Dependencies -----
echo "[7/7] Installing server dependencies..."
cd /var/www/shankoemee/ShanServer
npm init -y
npm install express socket.io@2 body-parser mongodb@3 lodash shortid bcryptjs

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "NEXT STEPS:"
echo ""
echo "  1. Copy your .env file:"
echo "     nano /var/www/shankoemee/.env"
echo ""
echo "  2. Copy server files:"
echo "     scp ShanServer/index.js ShanServer/cards.js root@YOUR_VPS_IP:/var/www/shankoemee/ShanServer/"
echo ""
echo "  3. Copy WebGL build:"
echo "     scp -r Build/WebGL/* root@YOUR_VPS_IP:/var/www/shankoemee/webgl/"
echo ""
echo "  4. Update Unity client server URL to: http://YOUR_VPS_IP"
echo ""
echo "  5. Configure Nginx:"
echo "     sudo nano /etc/nginx/sites-available/shankoemee"
echo "     (paste nginx.conf content, change 'yourdomain.com')"
echo "     sudo ln -s /etc/nginx/sites-available/shankoemee /etc/nginx/sites-enabled/"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  6. Start server with PM2:"
echo "     cd /var/www/shankoemee && pm2 start ecosystem.config.js"
echo "     pm2 save && pm2 startup"
echo ""