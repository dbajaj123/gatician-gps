const express = require('express');
const locationController = require('../controllers/locationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { locationValidation } = require('../utils/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all locations (paginated)
router.get('/', locationController.getAllLocations);

// Get all latest locations for all devices
router.get('/latest/all', locationController.getAllLatestLocations);

// Get latest location for a specific device
router.get('/latest/:imei', locationController.getLatestLocation);

// Get location history for a device
router.get('/history/:imei', validate(locationValidation.query, 'query'), locationController.getLocationHistory);

// Get locations within a radius
router.get('/radius', validate(locationValidation.radius, 'query'), locationController.getLocationsInRadius);

// Create location manually (for testing)
router.post('/', validate(locationValidation.create), locationController.createLocation);

// Delete old locations (admin only)
router.delete('/cleanup', authorize('admin', 'superadmin'), locationController.deleteOldLocations);

// Delete all locations for a device
router.delete('/device/:imei', locationController.deleteDeviceLocations);

module.exports = router;
