# Gatician GPS Tracking System - Complete Setup Guide

This guide will help you set up and run both the backend and frontend of the Gatician GPS tracking system.

## Quick Start

### Prerequisites
- Node.js >= 16.0.0
- MongoDB installed and running
- npm >= 8.0.0

### Backend Setup

1. **Install backend dependencies**:
```powershell
npm install
```

2. **Configure environment variables**:
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/gatician-gps

# JWT Secrets (change these in production!)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

3. **Seed test data** (optional):
```powershell
node scripts/seedTestData.js
```

This creates:
- Admin user: `admin@example.com` / `admin123`
- Regular user: `user@example.com` / `user123`
- Test devices with sample data

4. **Start the backend server**:
```powershell
npm run dev
```

Backend will run on: http://localhost:3001

### Frontend Setup

1. **Navigate to frontend directory**:
```powershell
cd frontend
```

2. **Install frontend dependencies**:
```powershell
npm install
```

3. **Environment is already configured** (`.env` file exists)

4. **Start the frontend development server**:
```powershell
npm run dev
```

Frontend will run on: http://localhost:3000

### Access the Application

1. Open your browser and go to: http://localhost:3000
2. Login with test credentials:
   - **Email**: `admin@example.com`
   - **Password**: `admin123`

## Development Workflow

### Running Both Servers

**Option 1: Two separate terminals**

Terminal 1 (Backend):
```powershell
npm run dev
```

Terminal 2 (Frontend):
```powershell
cd frontend
npm run dev
```

**Option 2: Using process managers** (advanced)

You can use tools like `concurrently` to run both servers:
```powershell
npm install -g concurrently
concurrently "npm run dev" "cd frontend && npm run dev"
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│                  (http://localhost:3000)                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       ▼
┌─────────────────────────────────────────────────────────┐
│              React Frontend (Vite)                       │
│  • Authentication UI                                     │
│  • Interactive Maps (Leaflet)                           │
│  • Device Management                                     │
│  • Real-time Monitoring                                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ REST API
                       │ /api/v1/*
                       ▼
┌─────────────────────────────────────────────────────────┐
│           Node.js Backend (Express)                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  REST API (Port 3001)                          │    │
│  │  • /api/v1/auth/*                              │    │
│  │  • /api/v1/devices/*                           │    │
│  │  • /api/v1/locations/*                         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  TCP Server (Port 8080)                        │    │
│  │  • Receives GPS data from devices              │    │
│  │  • Parses GPS protocols                        │    │
│  │  • Stores location data                        │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Mongoose ODM
                       ▼
┌─────────────────────────────────────────────────────────┐
│              MongoDB Database                            │
│  • users collection                                      │
│  • devices collection                                    │
│  • locations collection                                  │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile

### Devices
- `GET /api/v1/devices` - Get all devices
- `GET /api/v1/devices/:id` - Get device by ID
- `GET /api/v1/devices/imei/:imei` - Get device by IMEI
- `POST /api/v1/devices` - Create new device
- `PUT /api/v1/devices/:id` - Update device
- `DELETE /api/v1/devices/:id` - Delete device

### Locations
- `GET /api/v1/locations/device/:imei` - Get locations for device
- `GET /api/v1/locations/device/:imei/latest` - Get latest location
- `GET /api/v1/locations/:id` - Get location by ID
- `POST /api/v1/locations` - Create location (admin only)

### System
- `GET /api/v1/health` - Health check
- `GET /api/v1/status` - Server status (admin only)

## Frontend Features

### Pages
1. **Login** - User authentication
2. **Register** - New user registration
3. **Dashboard** - Overview of all devices with map
4. **Devices** - Device management interface
5. **Monitor** - Real-time device monitoring
6. **Statistics** - Analytics (coming soon)

### Components
- **Layout** - Main application layout with sidebar and header
- **Sidebar** - Navigation menu
- **Header** - Top bar with search and notifications
- **MapView** - Interactive map with device markers
- **LoadingSpinner** - Loading indicator

### Key Features
- 🔐 JWT authentication with auto-refresh
- 🗺️ Real-time GPS tracking on interactive maps
- 📱 Fully responsive design
- 🔄 Auto-refresh every 7 seconds
- 🔍 Device search and filtering
- 📊 Device status indicators
- 🎨 Modern UI with Tailwind CSS

## Testing the Application

### Manual Testing

1. **Test Authentication**:
   - Try logging in with valid credentials
   - Try registering a new user
   - Verify token refresh works
   - Test logout functionality

2. **Test Dashboard**:
   - View all devices
   - Check device status indicators
   - Click on devices to see details
   - Test search functionality

3. **Test Maps**:
   - Verify map loads correctly
   - Click on markers to see popups
   - Check if device locations update

4. **Test Device Management**:
   - View device list
   - Search for devices
   - Filter by status

### API Testing

You can test the API using tools like Postman or curl:

```powershell
# Health check
curl http://localhost:3001/api/v1/health

# Login
curl -X POST http://localhost:3001/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@example.com","password":"admin123"}'

# Get devices (with token)
curl http://localhost:3001/api/v1/devices `
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Production Deployment

### Backend Deployment

1. **Set environment variables**:
```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_ACCESS_SECRET=generate-strong-secret
JWT_REFRESH_SECRET=generate-strong-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

2. **Build and start**:
```powershell
npm start
```

### Frontend Deployment

1. **Build the application**:
```powershell
cd frontend
npm run build
```

2. **Deploy the `dist` folder** to your hosting service:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Any static hosting service

3. **Update environment variables** for production API URL

## Troubleshooting

### Backend Issues

**MongoDB connection failed**:
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env file
- Verify MongoDB port (default: 27017)

**Port already in use**:
- Change PORT in .env file
- Or kill the process using the port

**JWT errors**:
- Ensure JWT secrets are set in .env
- Check token expiry settings

### Frontend Issues

**Cannot connect to API**:
- Verify backend is running on port 3001
- Check VITE_API_BASE_URL in frontend/.env
- Check CORS settings in backend

**Maps not loading**:
- Check internet connection
- Verify Leaflet CSS is loaded
- Check browser console for errors

**Build errors**:
- Clear node_modules: `rm -rf node_modules`
- Clear cache: `npm cache clean --force`
- Reinstall: `npm install`

## Additional Resources

- Backend API Documentation: `API_DOCUMENTATION.md`
- API Examples: `API_EXAMPLES.md`
- Frontend README: `frontend/README.md`
- HTTPS Setup: `HTTPS_SETUP.md`

## Support

For issues and questions:
1. Check the documentation files
2. Review the error logs
3. Open an issue on GitHub

## License

ISC
