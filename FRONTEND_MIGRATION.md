# Frontend Migration Guide

## 🔄 Updating Your Frontend to Work with New Backend

The backend has been completely rebuilt with new API structure. Here's how to update your frontend.

---

## 🚨 Breaking Changes

### Old API Endpoints (No Longer Available)
```javascript
❌ GET /coordinates              // Old endpoint
❌ GET /coordinates/:imei        // Old endpoint
❌ GET /test                     // Old endpoint
```

### New API Endpoints (Use These)
```javascript
✅ GET /api/v1/locations/latest/all          // Get all latest locations
✅ GET /api/v1/locations/latest/:imei        // Get latest by IMEI
✅ GET /api/v1/health                        // Health check
```

---

## 🔐 Authentication Required

All API calls now require authentication (except health check and auth endpoints).

### 1. User Registration/Login Flow

```javascript
// Register new user (one-time)
async function register() {
  const response = await fetch('http://localhost:3001/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'myuser',
      email: 'user@example.com',
      password: 'SecurePass123!'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Save tokens
    localStorage.setItem('accessToken', data.data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
  }
}

// Login
async function login() {
  const response = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'SecurePass123!'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Save tokens
    localStorage.setItem('accessToken', data.data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    
    // Save user info
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }
}
```

---

## 📡 Updated API Calls

### Get All Latest Locations (Replaces old /coordinates)

**Old Code:**
```javascript
async function fetchCoordinates() {
  const response = await fetch('http://localhost:3001/coordinates');
  const data = await response.json();
  return data;
}
```

**New Code:**
```javascript
async function fetchLatestLocations() {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:3001/api/v1/locations/latest/all', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    return result.data.data; // Array of { device, location }
  } else {
    console.error('Failed to fetch locations:', result.message);
    return [];
  }
}
```

### Response Format Change

**Old Response:**
```javascript
[
  {
    imei: "123456789012345",
    latitude: 40.7128,
    longitude: -74.0060,
    speed: 60,
    timestamp: "2025-11-11T12:00:00Z"
  }
]
```

**New Response:**
```javascript
{
  success: true,
  message: "Latest locations retrieved successfully",
  data: {
    count: 2,
    total: 2,
    data: [
      {
        device: {
          imei: "123456789012345",
          name: "Device 1",
          model: "GT06"
        },
        location: {
          _id: "...",
          imei: "123456789012345",
          latitude: 40.7128,
          longitude: -74.0060,
          speed: 60,
          timestamp: "2025-11-11T12:00:00Z",
          gpsStatus: "valid"
        }
      }
    ]
  }
}
```

---

## 🔄 Complete Frontend Update Example

### Updated script.js

```javascript
// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';

// Get access token
function getAccessToken() {
  return localStorage.getItem('accessToken');
}

// Check if user is logged in
function isAuthenticated() {
  return !!getAccessToken();
}

// Login (call this once on first load or when no token exists)
async function loginUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'your-email@example.com',
        password: 'your-password'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      localStorage.setItem('accessToken', result.data.tokens.accessToken);
      localStorage.setItem('refreshToken', result.data.tokens.refreshToken);
      return true;
    } else {
      console.error('Login failed:', result.message);
      return false;
    }
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

// Fetch all latest locations
async function fetchLocations() {
  try {
    // Check if authenticated
    if (!isAuthenticated()) {
      console.log('Not authenticated, attempting login...');
      const loggedIn = await loginUser();
      if (!loggedIn) {
        throw new Error('Authentication failed');
      }
    }
    
    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/locations/latest/all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data.data; // Array of { device, location }
    } else {
      // Handle token expiration
      if (response.status === 401) {
        console.log('Token expired, please login again');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Retry login
        return await fetchLocations();
      }
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

// Update map with locations
async function updateMap() {
  const locations = await fetchLocations();
  
  // Clear existing markers
  markers.forEach(marker => marker.remove());
  markers = [];
  
  // Add new markers
  locations.forEach(item => {
    if (item.location) {
      const { device, location } = item;
      
      // Create marker
      const marker = L.marker([location.latitude, location.longitude])
        .addTo(map)
        .bindPopup(`
          <b>${device.name || 'Unknown Device'}</b><br>
          IMEI: ${device.imei}<br>
          Speed: ${location.speed} km/h<br>
          Time: ${new Date(location.timestamp).toLocaleString()}<br>
          Status: ${location.gpsStatus}
        `);
      
      markers.push(marker);
    }
  });
  
  // Update device list
  updateDeviceList(locations);
}

// Update device list in sidebar
function updateDeviceList(locations) {
  const deviceList = document.getElementById('device-list');
  deviceList.innerHTML = '';
  
  locations.forEach(item => {
    if (item.location) {
      const { device, location } = item;
      
      const deviceItem = document.createElement('div');
      deviceItem.className = 'device-item';
      deviceItem.innerHTML = `
        <div class="device-name">${device.name || 'Unknown Device'}</div>
        <div class="device-imei">IMEI: ${device.imei}</div>
        <div class="device-coords">
          ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
        </div>
        <div class="device-speed">Speed: ${location.speed} km/h</div>
        <div class="device-time">${new Date(location.timestamp).toLocaleString()}</div>
      `;
      
      deviceItem.addEventListener('click', () => {
        map.setView([location.latitude, location.longitude], 13);
      });
      
      deviceList.appendChild(deviceItem);
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize map
  map = L.map('map').setView([40.7128, -74.0060], 10);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  // Initial load
  await updateMap();
  
  // Refresh every 30 seconds
  setInterval(updateMap, 30000);
});
```

---

## 🔧 Quick Fix for Existing Frontend

Add this at the top of your existing `script.js`:

```javascript
// Add this at the very top of your script.js
const API_BASE_URL = 'http://localhost:3001/api/v1';
const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // Get this from login

// Replace all fetch calls
function apiCall(endpoint) {
  return fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    }
  });
}

// Then replace:
// fetch('/coordinates') 
// with:
// apiCall('/locations/latest/all')
```

---

## 🎯 Getting Your First Access Token

### Option 1: Using cURL
```powershell
curl -X POST http://localhost:3001/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"frontenduser\",\"email\":\"frontend@example.com\",\"password\":\"Frontend123!\"}'
```

Copy the `accessToken` from the response.

### Option 2: Using Browser Console
```javascript
// Run this in browser console
fetch('http://localhost:3001/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'frontenduser',
    email: 'frontend@example.com',
    password: 'Frontend123!'
  })
})
.then(r => r.json())
.then(d => {
  console.log('Access Token:', d.data.tokens.accessToken);
  localStorage.setItem('accessToken', d.data.tokens.accessToken);
});
```

---

## ✅ Testing Your Frontend Updates

1. **Test Health Check** (no auth required)
   ```javascript
   fetch('http://localhost:3001/api/v1/health')
     .then(r => r.json())
     .then(d => console.log(d));
   ```

2. **Test Authentication**
   ```javascript
   // Should work
   fetch('http://localhost:3001/api/v1/locations/latest/all', {
     headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
   });
   
   // Should fail with 401
   fetch('http://localhost:3001/api/v1/locations/latest/all');
   ```

3. **Test with Valid Token**
   - You should see location data
   - Markers should appear on map
   - Device list should populate

---

## 📝 Summary of Changes

| What Changed | Old | New |
|--------------|-----|-----|
| **Base URL** | `http://localhost:3001` | `http://localhost:3001/api/v1` |
| **Endpoints** | `/coordinates` | `/locations/latest/all` |
| **Auth** | None | Required (Bearer token) |
| **Response** | Array directly | `{ success, message, data }` |
| **IMEI endpoint** | `/coordinates/:imei` | `/locations/latest/:imei` |

---

## 🆘 Need Help?

If you need help updating your frontend:
1. Share your current `script.js`
2. I can provide the exact updated code
3. See `API_EXAMPLES.md` for more examples

---

**✅ After these changes, your frontend will work with the new secure backend!**
