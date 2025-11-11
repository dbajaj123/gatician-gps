# Quick Start Guide - Gatician GPS Backend v2.0

## ⚡ Quick Setup (5 Minutes)

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Setup Environment
```powershell
# Copy environment template
Copy-Item .env.example .env

# Edit .env file - IMPORTANT: Change JWT_SECRET!
notepad .env
```

### Step 3: Start MongoDB
```powershell
# Start MongoDB service
net start MongoDB

# Verify MongoDB is running
mongo --eval "db.version()"
```

### Step 4: Create Admin User
```powershell
node scripts/createAdmin.js
```

### Step 5: Start the Server
```powershell
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

### Step 6: Test the API
Open a new terminal and test:
```powershell
# Health check
curl http://localhost:3001/api/v1/health

# Or open in browser:
# http://localhost:3001/api/v1/health
```

---

## 🎯 What You Get

### ✅ Running Services
- **HTTP API Server**: `http://localhost:3001/api/v1`
- **GPS TCP Server**: `0.0.0.0:3000`
- **MongoDB Database**: `mongodb://localhost:27017/gatician-gps`

### 📡 API Endpoints Ready
- Auth: `/api/v1/auth/*` (register, login, profile)
- Devices: `/api/v1/devices/*` (CRUD operations)
- Locations: `/api/v1/locations/*` (tracking data)
- Health: `/api/v1/health` (server status)

---

## 🧪 Testing Your Setup

### 1. Register a User
```powershell
curl -X POST http://localhost:3001/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"Test12345!\"}'
```

### 2. Login
```powershell
curl -X POST http://localhost:3001/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test12345!\"}'
```

Copy the `accessToken` from the response.

### 3. Create a Device
```powershell
curl -X POST http://localhost:3001/api/v1/devices `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"imei\":\"123456789012345\",\"name\":\"Test Device\",\"model\":\"GT06\"}'
```

### 4. Get All Devices
```powershell
curl -X GET http://localhost:3001/api/v1/devices `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔧 Optional: Seed Test Data

```powershell
node scripts/seedTestData.js
```

This creates:
- 2 test devices with IMEI numbers
- Sample location data for each device

---

## 🚀 Production Deployment

### Using PM2 (Recommended)
```powershell
# Install PM2 globally
npm install -g pm2

# Deploy
./deploy.sh

# Monitor
pm2 monit
```

---

## 📱 Connecting GPS Devices

### Configure Your GT06 Device
1. **Server IP**: Your server's public IP or domain
2. **Port**: `3000`
3. **Protocol**: TCP
4. **APN**: Your carrier's APN (if using mobile data)

### Example SMS Commands (GT06)
```
# Set server and port
SERVER,1,YOUR_SERVER_IP,3000#

# Check settings
STATUS#
```

---

## 🐛 Common Issues

### Port 3001 already in use
```powershell
# Find process using port
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID_NUMBER> /F
```

### MongoDB not starting
```powershell
# Check service status
sc query MongoDB

# Start service manually
net start MongoDB
```

### GPS device not connecting
1. Check firewall allows port 3000
2. Verify device configuration
3. Check logs: `npm start` or `pm2 logs gatician-gps`

---

## 📚 Next Steps

1. **Read API Documentation**: See `API_EXAMPLES.md`
2. **Configure Frontend**: Update frontend to use new API endpoints
3. **Set up HTTPS**: Use nginx or similar for SSL/TLS
4. **Enable MongoDB Auth**: Secure your database
5. **Monitor Logs**: Check `logs/` directory

---

## 📞 Support

- **GitHub Issues**: https://github.com/dbajaj123/gatician-gps/issues
- **Documentation**: See `README.md`
- **API Examples**: See `API_EXAMPLES.md`

---

## ✅ Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created and configured
- [ ] MongoDB running
- [ ] Admin user created
- [ ] Server started successfully
- [ ] Health check passes
- [ ] Test user registered
- [ ] Test device created
- [ ] API tested with authentication

**Congratulations! Your GPS tracking backend is ready! 🎉**
