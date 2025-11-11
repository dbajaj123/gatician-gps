# Gatician GPS Backend - API Examples

This file contains example API requests you can use with tools like Postman, cURL, or REST Client extensions.

Base URL: `http://localhost:3001/api/v1`

## Authentication

### 1. Register a New User
```http
POST http://localhost:3001/api/v1/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### 2. Login
```http
POST http://localhost:3001/api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### 3. Get Profile
```http
GET http://localhost:3001/api/v1/auth/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 4. Update Profile
```http
PUT http://localhost:3001/api/v1/auth/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "username": "john_updated"
}
```

### 5. Change Password
```http
PUT http://localhost:3001/api/v1/auth/change-password
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

### 6. Refresh Token
```http
POST http://localhost:3001/api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}
```

### 7. Logout
```http
POST http://localhost:3001/api/v1/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## Devices

### 1. Get All Devices
```http
GET http://localhost:3001/api/v1/devices?page=1&limit=10
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 2. Get Device Statistics
```http
GET http://localhost:3001/api/v1/devices/stats
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 3. Get Device by ID
```http
GET http://localhost:3001/api/v1/devices/DEVICE_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 4. Get Device by IMEI
```http
GET http://localhost:3001/api/v1/devices/imei/123456789012345
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 5. Create New Device
```http
POST http://localhost:3001/api/v1/devices
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "imei": "123456789012345",
  "name": "My GPS Tracker",
  "model": "GT06",
  "metadata": {
    "vehicle": "Toyota Camry",
    "plate": "ABC123"
  }
}
```

### 6. Update Device
```http
PUT http://localhost:3001/api/v1/devices/DEVICE_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Updated Tracker Name",
  "isActive": true
}
```

### 7. Delete Device
```http
DELETE http://localhost:3001/api/v1/devices/DEVICE_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## Locations

### 1. Get All Locations (Paginated)
```http
GET http://localhost:3001/api/v1/locations?page=1&limit=50&sortBy=timestamp&sortOrder=desc
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 2. Get All Latest Locations
```http
GET http://localhost:3001/api/v1/locations/latest/all
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 3. Get Latest Location for Device
```http
GET http://localhost:3001/api/v1/locations/latest/123456789012345
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 4. Get Location History
```http
GET http://localhost:3001/api/v1/locations/history/123456789012345?startDate=2025-01-01&endDate=2025-12-31&limit=100
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 5. Get Locations Within Radius
```http
GET http://localhost:3001/api/v1/locations/radius?latitude=40.7128&longitude=-74.0060&radius=10
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 6. Create Location Manually (Testing)
```http
POST http://localhost:3001/api/v1/locations
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "imei": "123456789012345",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "speed": 60,
  "course": 180,
  "altitude": 100,
  "accuracy": 5,
  "timestamp": "2025-11-11T12:00:00Z",
  "gpsStatus": "valid",
  "satellites": 8
}
```

### 7. Delete Old Locations (Admin Only)
```http
DELETE http://localhost:3001/api/v1/locations/cleanup?days=30
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

---

## System

### 1. Health Check
```http
GET http://localhost:3001/api/v1/health
```

### 2. Server Status (Admin Only)
```http
GET http://localhost:3001/api/v1/status
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

---

## cURL Examples

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123!"}'
```

### Get All Devices
```bash
curl -X GET http://localhost:3001/api/v1/devices \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Device
```bash
curl -X POST http://localhost:3001/api/v1/devices \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imei":"123456789012345","name":"My GPS Tracker","model":"GT06"}'
```

### Get Latest Location
```bash
curl -X GET http://localhost:3001/api/v1/locations/latest/123456789012345 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [],
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
