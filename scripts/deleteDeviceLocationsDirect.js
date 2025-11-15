// scripts/deleteDeviceLocationsDirect.js
// Direct MongoDB deletion for device locations

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gatician';
const IMEI = '8600000000100000';

async function deleteLocations() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;
    const locationsCollection = db.collection('locations');

    console.log(`🗑️  Deleting locations for device ${IMEI}...`);
    const result = await locationsCollection.deleteMany({ imei: IMEI });
    
    console.log(`✅ Deleted ${result.deletedCount} locations`);

    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteLocations();
