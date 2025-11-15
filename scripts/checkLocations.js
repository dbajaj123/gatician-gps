// scripts/checkLocations.js
// Check how many locations exist for a device

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://api.gatician.com:3001/api/v1';
const TEST_USER = {
  email: 'test@gatician.com',
  password: 'Test@123456',
};
const IMEI = '8600000000100000';

async function checkLocations() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    const token = loginRes.data.data.tokens.accessToken;
    console.log('✅ Logged in\n');

    // Get location count
    console.log(`📍 Checking locations for device ${IMEI}...`);
    const response = await axios.get(`${API_BASE_URL}/locations`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { 
        imei: IMEI,
        limit: 10000,
        sortBy: 'timestamp',
        sortOrder: 'asc'
      },
    });

    const locations = response.data.data.data || response.data.data.locations || response.data.data;
    console.log(`\nTotal locations: ${locations.length}`);
    
    if (locations.length > 0) {
      console.log(`\nFirst location timestamp: ${locations[0].timestamp}`);
      console.log(`Last location timestamp: ${locations[locations.length - 1].timestamp}`);
      
      // Group by date
      const byDate = {};
      locations.forEach(loc => {
        const date = new Date(loc.timestamp).toISOString().split('T')[0];
        byDate[date] = (byDate[date] || 0) + 1;
      });
      
      console.log('\nLocations by date:');
      Object.entries(byDate).sort().forEach(([date, count]) => {
        console.log(`  ${date}: ${count} points`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

checkLocations();
