# Gatician GPS Backend - API Documentation v2.0

Complete API reference for the Gatician GPS tracking backend.

**Base URL:** `http://localhost:3001/api/v1`  
**Authentication:** Bearer Token (JWT)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Devices](#devices)
3. [Locations](#locations)
4. [System](#system)
5. [Response Formats](#response-formats)
6. [Error Codes](#error-codes)
7. [Rate Limits](#rate-limits)

---

## Authentication

All endpoints except `/auth/register`, `/auth/login`, `/auth/refresh-token`, and `/health` require authentication.

**Include token in header:**
```
Authorization: Bearer <your_access_token>
```

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`  
**Auth Required:** No  
**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "username": "string (3-50 chars, alphanumeric)",
  "email": "string (valid email)",
  "password": "string (min 8 chars)",
  "role": "string (optional: 'user' or 'admin')"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2025-11-11T12:00:00.000Z",
      "updatedAt": "2025-11-11T12:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `409` - Email or username already exists
- `429` - Too many requests

---

### Login

Authenticate and receive access tokens.

**Endpoint:** `POST /auth/login`  
**Auth Required:** No  
**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "lastLogin": "2025-11-11T12:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Invalid credentials
- `403` - Account inactive
- `429` - Too many requests

---

### Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /auth/refresh-token`  
**Auth Required:** No

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**
- `400` - Refresh token required
- `401` - Invalid or expired refresh token

---

### Get Profile

Get current user profile.

**Endpoint:** `GET /auth/profile`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "lastLogin": "2025-11-11T12:00:00.000Z",
      "createdAt": "2025-11-11T12:00:00.000Z",
      "updatedAt": "2025-11-11T12:00:00.000Z"
    }
  }
}
```

---

### Update Profile

Update user profile information.

**Endpoint:** `PUT /auth/profile`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "username": "string (optional, 3-50 chars)",
  "email": "string (optional, valid email)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { /* updated user object */ }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `409` - Email or username already taken

---

### Change Password

Change user password.

**Endpoint:** `PUT /auth/change-password`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 8 chars)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Current password incorrect

---

### Logout

Invalidate current session.

**Endpoint:** `POST /auth/logout`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Devices

Manage GPS tracking devices.

### Get All Devices

Retrieve all devices (paginated).

**Endpoint:** `GET /devices`  
**Auth Required:** Yes

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 10, max: 100)
- `sortBy` (string, optional): Field to sort by (default: createdAt)
- `sortOrder` (string, optional): 'asc' or 'desc' (default: desc)
- `search` (string, optional): Search in name, IMEI, or model

**Success Response (200):**
```json
{
  "success": true,
  "message": "Devices retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "imei": "123456789012345",
      "name": "My GPS Tracker",
      "model": "GT06",
      "owner": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "john_doe",
        "email": "john@example.com"
      },
      "isActive": true,
      "connectionStatus": "online",
      "lastConnection": "2025-11-11T12:00:00.000Z",
      "createdAt": "2025-11-11T12:00:00.000Z",
      "updatedAt": "2025-11-11T12:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### Get Device by ID

Retrieve a specific device by ID.

**Endpoint:** `GET /devices/:id`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Device retrieved successfully",
  "data": {
    "device": {
      "_id": "507f1f77bcf86cd799439011",
      "imei": "123456789012345",
      "name": "My GPS Tracker",
      "model": "GT06",
      "owner": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "john_doe",
        "email": "john@example.com"
      },
      "isActive": true,
      "connectionStatus": "online",
      "lastConnection": "2025-11-11T12:00:00.000Z",
      "metadata": {
        "vehicle": "Toyota Camry",
        "plate": "ABC123"
      },
      "createdAt": "2025-11-11T12:00:00.000Z",
      "updatedAt": "2025-11-11T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `403` - Access denied (not owner/admin)
- `404` - Device not found

---

### Get Device by IMEI

Retrieve a device by IMEI number.

**Endpoint:** `GET /devices/imei/:imei`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Device retrieved successfully",
  "data": {
    "device": { /* device object */ }
  }
}
```

**Error Responses:**
- `403` - Access denied
- `404` - Device not found

---

### Create Device

Register a new GPS device.

**Endpoint:** `POST /devices`  
**Auth Required:** Yes  
**Rate Limit:** 10 devices per hour

**Request Body:**
```json
{
  "imei": "string (15 digits, required)",
  "name": "string (max 100 chars, optional)",
  "model": "string (max 50 chars, optional)",
  "metadata": {
    "key": "value"
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Device created successfully",
  "data": {
    "device": {
      "_id": "507f1f77bcf86cd799439011",
      "imei": "123456789012345",
      "name": "My GPS Tracker",
      "model": "GT06",
      "owner": "507f1f77bcf86cd799439011",
      "isActive": true,
      "connectionStatus": "unknown",
      "createdAt": "2025-11-11T12:00:00.000Z",
      "updatedAt": "2025-11-11T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error (invalid IMEI format)
- `409` - Device with this IMEI already exists
- `429` - Rate limit exceeded

---

### Update Device

Update device information.

**Endpoint:** `PUT /devices/:id`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "string (optional)",
  "model": "string (optional)",
  "isActive": "boolean (optional)",
  "metadata": {
    "key": "value"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Device updated successfully",
  "data": {
    "device": { /* updated device object */ }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `403` - Access denied
- `404` - Device not found

---

### Delete Device

Delete a device.

**Endpoint:** `DELETE /devices/:id`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Device deleted successfully"
}
```

**Error Responses:**
- `403` - Access denied
- `404` - Device not found

---

### Get Device Statistics

Get device statistics for the user.

**Endpoint:** `GET /devices/stats`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Device statistics retrieved successfully",
  "data": {
    "stats": {
      "total": 10,
      "active": 8,
      "inactive": 2,
      "online": 5,
      "offline": 3,
      "unknown": 2
    }
  }
}
```

---

## Locations

Track and query GPS location data.

### Get All Locations

Retrieve all location records (paginated).

**Endpoint:** `GET /locations`  
**Auth Required:** Yes

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 50, max: 1000)
- `sortBy` (string, optional): Field to sort by (default: timestamp)
- `sortOrder` (string, optional): 'asc' or 'desc' (default: desc)
- `imei` (string, optional): Filter by specific device IMEI

**Success Response (200):**
```json
{
  "success": true,
  "message": "Locations retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "imei": "123456789012345",
      "latitude": 40.712800,
      "longitude": -74.006000,
      "speed": 60,
      "course": 180,
      "altitude": 100,
      "accuracy": 5,
      "timestamp": "2025-11-11T12:00:00.000Z",
      "gpsStatus": "valid",
      "satellites": 8,
      "createdAt": "2025-11-11T12:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 500,
    "itemsPerPage": 50,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### Get Latest Location

Get the most recent location for a specific device.

**Endpoint:** `GET /locations/latest/:imei`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Latest location retrieved successfully",
  "data": {
    "location": {
      "_id": "507f1f77bcf86cd799439011",
      "imei": "123456789012345",
      "latitude": 40.712800,
      "longitude": -74.006000,
      "speed": 60,
      "course": 180,
      "altitude": 100,
      "accuracy": 5,
      "timestamp": "2025-11-11T12:00:00.000Z",
      "gpsStatus": "valid",
      "satellites": 8
    }
  }
}
```

**Error Responses:**
- `403` - Access denied
- `404` - Device not found or no location data

---

### Get All Latest Locations

Get latest locations for all devices.

**Endpoint:** `GET /locations/latest/all`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Latest locations retrieved successfully",
  "data": {
    "count": 5,
    "total": 10,
    "data": [
      {
        "device": {
          "imei": "123456789012345",
          "name": "Device 1",
          "model": "GT06"
        },
        "location": {
          "_id": "507f1f77bcf86cd799439011",
          "imei": "123456789012345",
          "latitude": 40.712800,
          "longitude": -74.006000,
          "speed": 60,
          "timestamp": "2025-11-11T12:00:00.000Z",
          "gpsStatus": "valid"
        }
      }
    ]
  }
}
```

---

### Get Location History

Get historical location data for a device.

**Endpoint:** `GET /locations/history/:imei`  
**Auth Required:** Yes

**Query Parameters:**
- `startDate` (ISO date string, optional): Start of date range
- `endDate` (ISO date string, optional): End of date range
- `limit` (integer, optional): Maximum records (default: 100, max: 1000)

**Example:**
```
GET /locations/history/123456789012345?startDate=2025-11-01T00:00:00Z&endDate=2025-11-11T23:59:59Z&limit=500
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Location history retrieved successfully",
  "data": {
    "imei": "123456789012345",
    "count": 245,
    "locations": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "imei": "123456789012345",
        "latitude": 40.712800,
        "longitude": -74.006000,
        "speed": 60,
        "course": 180,
        "timestamp": "2025-11-11T12:00:00.000Z",
        "gpsStatus": "valid"
      }
    ]
  }
}
```

**Error Responses:**
- `400` - Invalid date format
- `403` - Access denied
- `404` - Device not found

---

### Get Locations in Radius

Find all recent locations within a geographic radius.

**Endpoint:** `GET /locations/radius`  
**Auth Required:** Yes

**Query Parameters:**
- `latitude` (number, required): Center latitude (-90 to 90)
- `longitude` (number, required): Center longitude (-180 to 180)
- `radius` (number, required): Radius in kilometers (0 to 10000)

**Example:**
```
GET /locations/radius?latitude=40.7128&longitude=-74.0060&radius=10
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Locations retrieved successfully",
  "data": {
    "center": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "radius": 10,
    "count": 3,
    "locations": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "imei": "123456789012345",
        "latitude": 40.712800,
        "longitude": -74.006000,
        "speed": 60,
        "timestamp": "2025-11-11T12:00:00.000Z",
        "distance": 0.523
      }
    ]
  }
}
```

**Error Responses:**
- `400` - Validation error (invalid coordinates or radius)

---

### Create Location (Manual)

Manually create a location record (for testing).

**Endpoint:** `POST /locations`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "imei": "string (15 digits, required)",
  "latitude": "number (-90 to 90, required)",
  "longitude": "number (-180 to 180, required)",
  "speed": "number (min 0, optional)",
  "course": "number (0-360, optional)",
  "altitude": "number (optional)",
  "accuracy": "number (min 0, optional)",
  "timestamp": "ISO date string (required)",
  "gpsStatus": "string ('valid', 'invalid', 'unknown', optional)",
  "satellites": "number (min 0, optional)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Location created successfully",
  "data": {
    "location": {
      "_id": "507f1f77bcf86cd799439011",
      "imei": "123456789012345",
      "latitude": 40.712800,
      "longitude": -74.006000,
      "speed": 60,
      "course": 180,
      "altitude": 100,
      "accuracy": 5,
      "timestamp": "2025-11-11T12:00:00.000Z",
      "gpsStatus": "valid",
      "satellites": 8,
      "createdAt": "2025-11-11T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `403` - Access denied
- `404` - Device not found

---

### Delete Old Locations

Delete location records older than specified days (Admin only).

**Endpoint:** `DELETE /locations/cleanup`  
**Auth Required:** Yes (Admin/Superadmin only)

**Query Parameters:**
- `days` (integer, optional): Delete locations older than this many days (default: 30)

**Example:**
```
DELETE /locations/cleanup?days=90
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Old locations deleted successfully",
  "data": {
    "deletedCount": 1523,
    "cutoffDate": "2025-08-13T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `403` - Access denied (admin only)

---

## System

System health and monitoring endpoints.

### Health Check

Check if the server is running (no authentication required).

**Endpoint:** `GET /health`  
**Auth Required:** No

**Success Response (200):**
```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2025-11-11T12:00:00.000Z",
    "uptime": 3600.5
  }
}
```

---

### Server Status

Get detailed server status including connected GPS devices (Admin only).

**Endpoint:** `GET /status`  
**Auth Required:** Yes (Admin/Superadmin only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Server status retrieved",
  "data": {
    "http": {
      "status": "running",
      "uptime": 3600.5
    },
    "tcp": {
      "status": "running",
      "connectedDevices": 5,
      "devices": [
        {
          "clientKey": "192.168.1.100:54321",
          "imei": "123456789012345",
          "lastActivity": "2025-11-11T12:00:00.000Z",
          "connected": true
        }
      ]
    },
    "memory": {
      "rss": 45678912,
      "heapTotal": 23456789,
      "heapUsed": 12345678,
      "external": 1234567
    },
    "timestamp": "2025-11-11T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `403` - Access denied (admin only)

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Descriptive success message",
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error for this field"
    }
  ]
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [ /* array of items */ ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request data or validation error |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error (check logs) |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/register` | 5 requests | 15 minutes |
| `/auth/login` | 5 requests | 15 minutes |
| `/devices` (POST) | 10 requests | 1 hour |
| General API | 100 requests | 15 minutes |

**Rate Limit Headers:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1699704000
```

---

## Data Models

### User
```javascript
{
  _id: ObjectId,
  username: String (3-50 chars),
  email: String (unique),
  role: String ('user', 'admin', 'superadmin'),
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Device
```javascript
{
  _id: ObjectId,
  imei: String (15 digits, unique),
  name: String (max 100 chars),
  model: String (max 50 chars),
  owner: ObjectId (ref: User),
  isActive: Boolean,
  lastConnection: Date,
  connectionStatus: String ('online', 'offline', 'unknown'),
  metadata: Map,
  createdAt: Date,
  updatedAt: Date
}
```

### Location
```javascript
{
  _id: ObjectId,
  imei: String (15 digits),
  latitude: Number (-90 to 90),
  longitude: Number (-180 to 180),
  speed: Number (km/h),
  course: Number (0-360 degrees),
  altitude: Number (meters),
  accuracy: Number (meters),
  timestamp: Date,
  gpsStatus: String ('valid', 'invalid', 'unknown'),
  satellites: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Examples

### Complete Authentication Flow

```javascript
// 1. Register
const registerResponse = await fetch('http://localhost:3001/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});
const { data: registerData } = await registerResponse.json();
const accessToken = registerData.tokens.accessToken;

// 2. Get Profile
const profileResponse = await fetch('http://localhost:3001/api/v1/auth/profile', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// 3. Create Device
const deviceResponse = await fetch('http://localhost:3001/api/v1/devices', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imei: '123456789012345',
    name: 'My Tracker',
    model: 'GT06'
  })
});

// 4. Get Latest Locations
const locationsResponse = await fetch('http://localhost:3001/api/v1/locations/latest/all', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

---

## Support

- **GitHub:** https://github.com/dbajaj123/gatician-gps
- **Issues:** https://github.com/dbajaj123/gatician-gps/issues

---

**Version:** 2.0.0  
**Last Updated:** November 11, 2025
