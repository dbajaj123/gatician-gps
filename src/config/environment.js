const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  tcpPort: parseInt(process.env.TCP_PORT, 10) || 3000,
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/gatician-gps',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true,
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },
  
  gps: {
    protocol: process.env.GPS_PROTOCOL || 'GT06',
    coordinateDivisor: parseInt(process.env.GPS_COORDINATE_DIVISOR, 10) || 1800000,
    host: '0.0.0.0',
  },
  
  api: {
    prefix: process.env.API_PREFIX || '/api/v1',
  },
};
