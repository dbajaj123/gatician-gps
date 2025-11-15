// scripts/deleteAllLocations.js
// Delete all locations for device 8600000000100000

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://api.gatician.com:3001/api/v1';
const TEST_USER = {
  email: 'test@gatician.com',
  password: 'Test@123456',
};
const IMEI = '8600000000100000';

async function deleteAll() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    const token = loginRes.data.data.tokens.accessToken;
    console.log('✅ Logged in\n');

    // Delete locations
    console.log(`🗑️  Deleting all locations for device ${IMEI}...`);
    const response = await axios.delete(`${API_BASE_URL}/locations/device/${IMEI}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ Deleted:', response.data.data.deletedCount, 'locations');

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

deleteAll();
