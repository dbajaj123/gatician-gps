// scripts/resetAndUpload.js
// Deletes existing locations and uploads fresh synthetic data

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://api.gatician.com:3001/api/v1';
const INPUT_FILE = path.join(__dirname, 'synthetic_locations.json');

// Test user credentials
const TEST_USER = {
  username: 'testuser',
  email: 'test@gatician.com',
  password: 'Test@123456',
  fullName: 'Test User',
};

let accessToken = null;

async function registerUser() {
  try {
    console.log(`🔐 Registering user ${TEST_USER.email}...`);
    console.log(`   API URL: ${API_BASE_URL}/auth/register`);
    const response = await axios.post(`${API_BASE_URL}/auth/register`, TEST_USER);

    if (response.data.success) {
      console.log('✅ User registered successfully');
      return true;
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 400 || error.response.status === 409) {
        if (error.response.data?.message?.includes('already') || error.response.data?.message?.includes('exists') || error.response.data?.message?.includes('registered')) {
          console.log('ℹ️  User already exists, will try to login');
          return true;
        }
      }
      console.error('❌ Registration failed:', error.response.data?.message || error.message);
    } else if (error.request) {
      console.error('❌ No response from server. Is the backend running?');
    } else {
      console.error('❌ Error:', error.message);
    }
    return false;
  }
}

async function login() {
  try {
    console.log(`🔐 Logging in as ${TEST_USER.email}...`);
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (response.data.success && response.data.data.tokens) {
      accessToken = response.data.data.tokens.accessToken;
      console.log('✅ Login successful\n');
      return true;
    } else {
      console.error('❌ Login failed: Invalid response format');
      return false;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function createDevice(imei, retries = 3) {
  try {
    const checkResponse = await axios.get(`${API_BASE_URL}/devices/imei/${imei}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (checkResponse.data.success) {
      console.log(`  ℹ️  Device ${imei} already exists`);
      return true;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const createResponse = await axios.post(
            `${API_BASE_URL}/devices`,
            {
              imei,
              name: `Auto ${imei.slice(-4)}`,
              model: 'GT06',
              isActive: true,
            },
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          console.log(`  ✅ Created device ${imei}`);
          return true;
        } catch (createError) {
          if (createError.response?.status === 429 || createError.response?.data?.message?.includes('Too many')) {
            const waitTime = Math.pow(2, attempt) * 2000;
            console.log(`  ⏳ Rate limited, waiting ${waitTime/1000}s before retry ${attempt + 1}/${retries}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          console.error(`  ❌ Failed to create device ${imei}:`, createError.response?.data?.message || createError.message);
          return false;
        }
      }
      console.error(`  ❌ Failed to create device ${imei} after ${retries} attempts`);
      return false;
    } else {
      console.error(`  ❌ Error checking device ${imei}:`, error.response?.data?.message || error.message);
      return false;
    }
  }
}

async function deleteDeviceLocations(imei) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/locations/device/${imei}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(`  🗑️  Deleted ${response.data.data?.deletedCount || 0} existing locations for ${imei}`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`  ℹ️  No existing locations to delete for ${imei}`);
      return true;
    }
    console.error(`  ❌ Failed to delete locations for ${imei}:`, error.response?.data?.message || error.message);
    return false;
  }
}

async function postLocation(location) {
  try {
    await axios.post(`${API_BASE_URL}/locations`, location, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to post location:`, error.response?.data?.message || error.message);
    return false;
  }
}

async function resetAndUpload() {
  try {
    // Read synthetic data
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`❌ File not found: ${INPUT_FILE}`);
      console.log('Run: node scripts/generate_synthetic_locations.js first');
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    console.log(`📂 Loaded ${data.length} location points from ${INPUT_FILE}\n`);

    // Register user (will skip if exists)
    const registered = await registerUser();
    if (!registered) {
      process.exit(1);
    }

    // Login
    const loggedIn = await login();
    if (!loggedIn) {
      process.exit(1);
    }

    // Get unique IMEIs
    const uniqueImeis = [...new Set(data.map(loc => loc.imei))];
    console.log(`📱 Found ${uniqueImeis.length} unique devices\n`);

    // Create devices
    console.log('Creating devices...');
    for (const imei of uniqueImeis) {
      await createDevice(imei);
    }
    console.log('');

    // Delete existing locations for these devices
    console.log('🗑️  Deleting existing locations (reset)...');
    for (const imei of uniqueImeis) {
      await deleteDeviceLocations(imei);
    }
    console.log('');

    // Post locations with progress
    console.log(`📍 Uploading ${data.length} location points...`);
    let success = 0;
    let failed = 0;
    const batchSize = 50;

    for (let i = 0; i < data.length; i++) {
      const location = data[i];
      const posted = await postLocation(location);
      
      if (posted) {
        success++;
      } else {
        failed++;
      }

      // Progress indicator
      if ((i + 1) % batchSize === 0 || i === data.length - 1) {
        const percent = ((i + 1) / data.length * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${i + 1}/${data.length} (${percent}%) - Success: ${success}, Failed: ${failed}`);
      }

      // Small delay to avoid overwhelming the server
      if (i < data.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    console.log('\n\n✅ Reset and upload complete!');
    console.log(`   Success: ${success}`);
    console.log(`   Failed: ${failed}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
resetAndUpload();
