const express = require('express');
const authRoutes = require('./authRoutes');
const deviceRoutes = require('./deviceRoutes');
const locationRoutes = require('./locationRoutes');
const { successResponse } = require('../utils/response');
const gpsTcpServer = require('../services/gpsTcpServer');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  successResponse(res, 200, 'Server is healthy', {
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Server status endpoint (protected)
router.get('/status', authenticate, authorize('admin', 'superadmin'), (req, res) => {
  const connectedDevices = gpsTcpServer.getConnectedDevices();
  
  successResponse(res, 200, 'Server status retrieved', {
    http: {
      status: 'running',
      uptime: process.uptime(),
    },
    tcp: {
      status: 'running',
      connectedDevices: gpsTcpServer.getConnectedDevicesCount(),
      devices: connectedDevices,
    },
    memory: process.memoryUsage(),
    timestamp: new Date(),
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/locations', locationRoutes);

module.exports = router;
