#!/bin/bash

# Deployment script for Gatician GPS server
echo "🚀 Deploying Gatician GPS server..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Stop existing PM2 process if running
echo "🛑 Stopping existing PM2 process..."
pm2 stop index 2>/dev/null || true
pm2 delete index 2>/dev/null || true

# Start the application with PM2
echo "▶️  Starting application with PM2..."
pm2 start index.js --name "index"

# Show PM2 status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment complete!"
echo "🌐 HTTP API: http://localhost:3001"
echo "📡 TCP Server: 0.0.0.0:3000"