# Gatician GPS Tracking System

Full-stack GPS tracking platform with React frontend and Node.js backend. Track GPS devices in real-time with an intuitive web interface.

## 🌟 Overview

Gatician is a complete GPS tracking solution featuring:
- **Modern React Frontend**: Interactive dashboard with real-time maps
- **Secure REST API Backend**: Node.js/Express with JWT authentication
- **TCP GPS Server**: Receives data from GPS devices
- **MongoDB Database**: Efficient storage and retrieval

---

## 📸 Screenshots

### Login Page
Beautiful authentication interface with form validation
![Login Page - see attachments]

### Dashboard with Live Map
Real-time device tracking with interactive maps
![Dashboard - see attachments]

---

## 🚀 Quick Start

### Option 1: Automated Setup (Windows)

Run the setup script:
```bash
setup.bat
```

Then start both servers:
```bash
start-dev.bat
```

### Option 2: Manual Setup

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

---

## 🎯 Features

## 🎯 Features

### Frontend (React + Vite)
- 🔐 **Authentication**: Secure login/register with JWT
- 🗺️ **Interactive Maps**: Real-time device tracking with React Leaflet
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- � **Auto-Refresh**: Live updates every 7 seconds
- 🎨 **Modern UI**: Beautiful interface with Tailwind CSS
- 📊 **Dashboard**: Overview with statistics and device status
- 🖥️ **Monitor**: Detailed real-time device monitoring
- 📡 **Device Management**: Add, edit, and manage devices

### Backend (Node.js + Express)

- **🔐 Security First**
  - JWT-based authentication with refresh tokens
  - Role-based access control (RBAC)
  - Rate limiting and DDoS protection
  - Input validation and sanitization
  - Helmet.js for security headers
  - Protection against NoSQL injection and XSS

- **📡 GPS Tracking**
  - TCP server for GT06 GPS protocol
  - Real-time location tracking
  - Location history and analytics
  - Geospatial queries (radius search)
  - Multiple device support

- **🎯 REST API**
  - Comprehensive REST API with validation
  - Pagination and filtering
  - Error handling and logging
  - API versioning
  - Health checks and monitoring

- **💾 Database**
  - MongoDB with Mongoose ODM
  - Data validation and schema enforcement
  - Indexing for performance
  - Automatic connection management

- **📊 Logging & Monitoring**
  - Winston logger with daily rotation
  - Request/response logging
  - Error tracking
  - Performance monitoring

## 📋 Prerequisites

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm >= 8.0.0
- PM2 (for production deployment)

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/dbajaj123/gatician-gps.git
cd gatician-gps
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` and update the following:
```env
NODE_ENV=production
PORT=3001
TCP_PORT=3000
MONGODB_URI=mongodb://localhost:27017/gatician-gps
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=http://your-frontend-domain.com
```

### 4. Start MongoDB
```bash
# On Windows
net start MongoDB

# On Linux/Mac
sudo systemctl start mongod
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Using PM2 (Recommended for Production)
```bash
chmod +x deploy.sh
./deploy.sh
```

## 📚 API Documentation

Base URL: `http://localhost:3001/api/v1`

### Authentication

#### Register a new user
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### Devices

All device endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

#### Get all devices
```http
GET /api/v1/devices?page=1&limit=10
```

#### Create a new device
```http
POST /api/v1/devices
Content-Type: application/json

{
  "imei": "123456789012345",
  "name": "My GPS Tracker",
  "model": "GT06"
}
```

#### Get device by IMEI
```http
GET /api/v1/devices/imei/123456789012345
```

#### Update device
```http
PUT /api/v1/devices/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "isActive": true
}
```

#### Delete device
```http
DELETE /api/v1/devices/:id
```

### Locations

#### Get all latest locations
```http
GET /api/v1/locations/latest/all
```

#### Get latest location for a device
```http
GET /api/v1/locations/latest/:imei
```

#### Get location history
```http
GET /api/v1/locations/history/:imei?startDate=2025-01-01&endDate=2025-12-31&limit=100
```

#### Get locations within radius
```http
GET /api/v1/locations/radius?latitude=40.7128&longitude=-74.0060&radius=10
```

### System

#### Health check
```http
GET /api/v1/health
```

#### Server status (Admin only)
```http
GET /api/v1/status
Authorization: Bearer <admin_access_token>
```

## 🔒 Security Best Practices

1. **Change default JWT secret** in `.env` file
2. **Use strong passwords** (min 8 characters)
3. **Enable HTTPS** in production
4. **Configure CORS** to allow only trusted domains
5. **Keep dependencies updated**: `npm audit fix`
6. **Use environment variables** for sensitive data
7. **Enable MongoDB authentication** in production
8. **Set up firewall rules** for ports 3000 and 3001
9. **Regular backups** of MongoDB database
10. **Monitor logs** for suspicious activity

## 📊 Project Structure

```
gatician-gps/
├── src/
│   ├── config/
│   │   ├── database.js       # MongoDB configuration
│   │   ├── environment.js    # Environment variables
│   │   └── logger.js         # Winston logger setup
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── deviceController.js
│   │   └── locationController.js
│   ├── middleware/
│   │   ├── auth.js           # Authentication & authorization
│   │   ├── errorHandler.js   # Error handling
│   │   ├── rateLimiter.js    # Rate limiting
│   │   └── validator.js      # Request validation
│   ├── models/
│   │   ├── User.js
│   │   ├── Device.js
│   │   └── Location.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── deviceRoutes.js
│   │   ├── locationRoutes.js
│   │   └── index.js
│   ├── services/
│   │   └── gpsTcpServer.js   # GPS TCP server
│   ├── utils/
│   │   ├── gpsParser.js      # GPS protocol parser
│   │   ├── response.js       # Response helpers
│   │   ├── tokenService.js   # JWT token management
│   │   └── validation.js     # Joi validation schemas
│   └── index.js              # Main entry point
├── logs/                     # Application logs
├── .env.example              # Environment template
├── .gitignore
├── deploy.sh                 # Deployment script
├── package.json
└── README.md

**For Backend Developers**: See `docs/backend.md` for a focused developer guide, setup checklist, coding standards, and deployment procedures.
```

## 🧪 Testing

```bash
npm test
```

## 📝 Useful Commands

### PM2 Commands
```bash
pm2 status              # Check status
pm2 logs gatician-gps   # View logs
pm2 restart gatician-gps # Restart application
pm2 stop gatician-gps   # Stop application
pm2 monit               # Monitor resources
```

### MongoDB Commands
```bash
# Connect to MongoDB
mongo gatician-gps

# Show collections
show collections

# Query devices
db.devices.find().pretty()

# Query locations
db.locations.find().limit(10).pretty()
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### MongoDB connection error
- Check if MongoDB is running
- Verify MONGODB_URI in `.env`
- Check MongoDB authentication settings

### GPS device not connecting
- Verify TCP port 3000 is open
- Check firewall settings
- Review GPS device configuration
- Check logs: `pm2 logs gatician-gps`

## 📄 License

ISC

## 👨‍💻 Author

GitHub: [@dbajaj123](https://github.com/dbajaj123)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if this project helped you!
