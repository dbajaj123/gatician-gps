const mongoose = require('mongoose');
const logger = require('./logger');
const config = require('./environment');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      // Set mongoose options
      mongoose.set('strictQuery', false);

      // Connect to MongoDB
      this.connection = await mongoose.connect(config.database.uri);

      logger.info(`✅ MongoDB connected successfully: ${this.connection.connection.host}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected successfully');
      });

      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error.message);
      logger.error('Make sure MongoDB is running. Start it with: net start MongoDB (Windows) or sudo systemctl start mongod (Linux)');
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
    }
  }

  async clearDatabase() {
    if (config.env === 'test') {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      logger.info('Test database cleared');
    }
  }
}

module.exports = new Database();
