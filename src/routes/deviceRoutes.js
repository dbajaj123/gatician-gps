const express = require('express');
const deviceController = require('../controllers/deviceController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { deviceValidation } = require('../utils/validation');
const { deviceLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all devices
router.get('/', deviceController.getAllDevices);

// Get device statistics
router.get('/stats', deviceController.getDeviceStats);

// Get device by ID
router.get('/:id', deviceController.getDeviceById);

// Get device by IMEI
router.get('/imei/:imei', deviceController.getDeviceByImei);

// Create new device (with rate limiting)
router.post('/', deviceLimiter, validate(deviceValidation.create), deviceController.createDevice);

// Update device
router.put('/:id', validate(deviceValidation.update), deviceController.updateDevice);

// Delete device
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;
