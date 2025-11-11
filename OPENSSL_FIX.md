# Fix for OpenSSL Errors

## Problem
Getting OpenSSL errors when calling APIs, typically happens with Node.js v17+ due to OpenSSL 3.0 changes.

## Solution 1: Set OpenSSL Legacy Provider (Recommended)

### On Linux (your server):
```bash
# Add to your PM2 startup
pm2 delete index
pm2 start src/index.js --name index --node-args="--openssl-legacy-provider"

# OR set environment variable permanently
echo 'export NODE_OPTIONS="--openssl-legacy-provider"' >> ~/.bashrc
source ~/.bashrc
pm2 restart index
```

### On Windows (local development):
```powershell
# Set environment variable
$env:NODE_OPTIONS="--openssl-legacy-provider"
npm start

# OR add to package.json
```

## Solution 2: Update package.json Scripts

Add this to your package.json scripts:
```json
"scripts": {
  "start": "NODE_OPTIONS='--openssl-legacy-provider' node src/index.js",
  "dev": "NODE_OPTIONS='--openssl-legacy-provider' nodemon src/index.js"
}
```

## Solution 3: Downgrade Node.js (if nothing else works)
```bash
# Use Node.js v16 LTS instead of v22
nvm install 16
nvm use 16
npm install
pm2 restart index
```

## Solution 4: Fix TLS/SSL in Node.js
If calling external HTTPS APIs:
```javascript
// Add to top of src/index.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // NOT recommended for production
```

## Verify the Fix
After applying any solution:
```bash
pm2 logs index --lines 50
```

Look for:
- ✅ No OpenSSL errors
- ✅ Server starts successfully
- ✅ GPS device connects and saves data
