require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const config = require('./config/environment');
const logger = require('./config/logger');
const database = require('./config/database');
const routes = require('./routes');
const gpsTcpServer = require('./services/gpsTcpServer');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

class Server {
  constructor() {
    this.app = express();
    this.httpServer = null;
  }

  /**
   * Initialize middleware
   */
  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: config.env === 'production' ? undefined : false,
    }));

    // CORS
    this.app.use(cors(config.cors));

    // Data sanitization against NoSQL injection
    this.app.use(mongoSanitize());

    // Data sanitization against XSS
    this.app.use(xss());

    // Compression
    this.app.use(compression());

    // Body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    if (config.env === 'production') {
      this.app.use(config.api.prefix, apiLimiter);
    }

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      next();
    });
  }

  /**
   * Initialize routes
   */
  initializeRoutes() {
    // API routes
    this.app.use(config.api.prefix, routes);

    // 404 handler
    this.app.use(notFound);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Connect to database
   */
  async connectDatabase() {
    try {
      await database.connect();
    } catch (error) {
      logger.error('Database connection failed:', error);
      process.exit(1);
    }
  }

  /**
   * Start HTTP server
   */
  startHttpServer() {
    return new Promise((resolve) => {
      this.httpServer = this.app.listen(config.port, () => {
        logger.info(`🌐 HTTP Server listening on port ${config.port}`);
        logger.info(`📡 Environment: ${config.env}`);
        logger.info(`📋 API Base URL: http://localhost:${config.port}${config.api.prefix}`);
        resolve();
      });
    });
  }

  /**
   * Start GPS TCP server
   */
  startGpsServer() {
    try {
      gpsTcpServer.start();
    } catch (error) {
      logger.error('Failed to start GPS TCP server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      if (this.httpServer) {
        this.httpServer.close(() => {
          logger.info('HTTP server closed');
        });
      }

      // Stop GPS TCP server
      gpsTcpServer.stop();

      // Close database connection
      await database.disconnect();

      logger.info('Graceful shutdown completed');
      process.exit(0);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }

  /**
   * Start the server
   */
  async start() {
    try {
      logger.info('🚀 Starting Gatician GPS Backend...');

      // Connect to database
      await this.connectDatabase();

      // Initialize middleware
      this.initializeMiddleware();

      // Initialize routes
      this.initializeRoutes();

      // Start HTTP server
      await this.startHttpServer();

      // Start GPS TCP server
      this.startGpsServer();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info('✅ All services started successfully');
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Create and start server
const server = new Server();
server.start();

module.exports = server;
