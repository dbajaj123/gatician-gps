const mongoose = require('mongoose');
const { Device, Location } = require('./src/models');
const logger = require('./src/config/logger');
const config = require('./src/config/environment');

async function seedTestData() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, config.database.options);
    logger.info('Connected to MongoDB');

    console.log('🌱 Seeding test data...\n');

    // Create test devices
    const testDevices = [
      {
        imei: '123456789012345',
        name: 'Test Device 1',
        model: 'GT06',
        isActive: true,
      },
      {
        imei: '123456789012346',
        name: 'Test Device 2',
        model: 'GT06',
        isActive: true,
      },
    ];

    for (const deviceData of testDevices) {
      const existingDevice = await Device.findOne({ imei: deviceData.imei });
      
      if (!existingDevice) {
        const device = new Device(deviceData);
        await device.save();
        console.log(`✅ Created device: ${device.name} (${device.imei})`);

        // Create sample location data
        const testLocation = new Location({
          imei: device.imei,
          latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
          speed: Math.floor(Math.random() * 100),
          course: Math.floor(Math.random() * 360),
          timestamp: new Date(),
          gpsStatus: 'valid',
          satellites: Math.floor(Math.random() * 12) + 4,
        });

        await testLocation.save();
        console.log(`  ✅ Created location for ${device.name}`);
      } else {
        console.log(`⚠️  Device already exists: ${deviceData.name} (${deviceData.imei})`);
      }
    }

    console.log('\n✅ Test data seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
seedTestData();
