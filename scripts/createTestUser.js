// scripts/createTestUser.js
// Creates a test user for uploading synthetic data

const mongoose = require('mongoose');
const { User } = require('../src/models');
const logger = require('../src/config/logger');

// Use MongoDB Atlas URI directly or from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gatician-gps';

async function createTestUser() {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');


    console.log('\n🔐 Creating test user for synthetic data upload...\n');

    const testUser = {
      username: 'testuser',
      email: 'test@gatician.com',
      password: 'Test@123456',
      role: 'user',
      isActive: true,
    };

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email: testUser.email }, { username: testUser.username }] });
    
    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log(`\nUser Details:`);
      console.log(`- Username: ${existingUser.username}`);
      console.log(`- Email: ${existingUser.email}`);
      console.log(`- Role: ${existingUser.role}`);
      console.log(`- ID: ${existingUser._id}`);
    } else {
      // Create test user
      const user = new User(testUser);
      await user.save();

      console.log('✅ Test user created successfully!');
      console.log(`\nUser Details:`);
      console.log(`- Username: ${user.username}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Role: ${user.role}`);
      console.log(`- ID: ${user._id}`);
    }

    console.log('\n📝 Credentials for upload script:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
createTestUser();
