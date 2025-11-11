#!/bin/bash

# Deployment script for Gatician GPS Backend v2.0
echo "🚀 Deploying Gatician GPS Backend v2.0..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please update .env file with your configuration"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Stop existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop gatician-gps 2>/dev/null || true
pm2 delete gatician-gps 2>/dev/null || true

# Start the application with PM2
echo "▶️  Starting application with PM2..."
pm2 start src/index.js --name "gatician-gps" --time --log-date-format "YYYY-MM-DD HH:mm:ss" --merge-logs

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
echo "🔄 Setting up PM2 startup script..."
pm2 startup

# Show PM2 status
echo "📊 PM2 Status:"
pm2 status

# Show application logs
echo ""
echo "📋 Recent logs:"
pm2 logs gatician-gps --lines 20 --nostream

echo ""
echo "✅ Deployment complete!"
echo "🌐 HTTP API: http://localhost:3001/api/v1"
echo "📡 GPS TCP Server: 0.0.0.0:3000"
echo "📊 Health Check: http://localhost:3001/api/v1/health"
echo ""
echo "Useful commands:"
echo "  - View logs: pm2 logs gatician-gps"
echo "  - Restart: pm2 restart gatician-gps"
echo "  - Stop: pm2 stop gatician-gps"
echo "  - Monitor: pm2 monit"