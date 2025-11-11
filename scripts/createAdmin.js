const mongoose = require('mongoose');
const readline = require('readline');
const { User } = require('./src/models');
const logger = require('./src/config/logger');
const config = require('./src/config/environment');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdminUser() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, config.database.options);
    logger.info('Connected to MongoDB');

    console.log('\n🔐 Create Admin User\n');

    const username = await question('Enter username: ');
    const email = await question('Enter email: ');
    const password = await question('Enter password (min 8 characters): ');

    // Validate input
    if (!username || username.length < 3) {
      console.error('❌ Username must be at least 3 characters');
      process.exit(1);
    }

    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address');
      process.exit(1);
    }

    if (!password || password.length < 8) {
      console.error('❌ Password must be at least 8 characters');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    
    if (existingUser) {
      console.error('❌ User with this email or username already exists');
      process.exit(1);
    }

    // Create admin user
    const adminUser = new User({
      username,
      email,
      password,
      role: 'admin',
      isActive: true,
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log(`\nUser Details:`);
    console.log(`- Username: ${adminUser.username}`);
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Role: ${adminUser.role}`);
    console.log(`- ID: ${adminUser._id}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
createAdminUser();
