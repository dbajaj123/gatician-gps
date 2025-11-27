const { Location, Device } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const logger = require('../config/logger');

class LocationController {
  /**
   * Get all locations
   */
  async getAllLocations(req, res) {
    try {
      const { page = 1, limit = 50, sortBy = 'timestamp', sortOrder = 'desc', imei } = req.query;
      
      const query = {};
      
      // Filter by IMEI if provided
      if (imei) {
        // Check device ownership
        const device = await Device.findOne({ imei });
        
        if (!device) {
          return errorResponse(res, 404, 'Device not found');
        }

        if (
          req.userRole !== 'admin' &&
          req.userRole !== 'superadmin' &&
          device.owner &&
          device.owner.toString() !== req.userId.toString()
        ) {
          return errorResponse(res, 403, 'Access denied');
        }

        query.imei = imei;
      } else {
        // Get all devices user owns
        if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
          const userDevices = await Device.find({ owner: req.userId }).select('imei');
          const imeis = userDevices.map(d => d.imei);
          query.imei = { $in: imeis };
        }
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [locations, total] = await Promise.all([
        Location.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Location.countDocuments(query),
      ]);

      return paginatedResponse(
        res,
        200,
        'Locations retrieved successfully',
        locations,
        {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        }
      );
    } catch (error) {
      logger.error('Get all locations error:', error);
      return errorResponse(res, 500, 'Failed to retrieve locations');
    }
  }

  /**
   * Get latest location for a device
   */
  async getLatestLocation(req, res) {
    try {
      const { imei } = req.params;

      // Check device ownership
      const device = await Device.findOne({ imei });
      
      if (!device) {
        return errorResponse(res, 404, 'Device not found');
      }

      if (
        req.userRole !== 'admin' &&
        req.userRole !== 'superadmin' &&
        device.owner &&
        device.owner.toString() !== req.userId.toString()
      ) {
        return errorResponse(res, 403, 'Access denied');
      }

      const location = await Location.getLatestByImei(imei);

      if (!location) {
        return errorResponse(res, 404, 'No location data found for this device');
      }

      return successResponse(res, 200, 'Latest location retrieved successfully', { location });
    } catch (error) {
      logger.error('Get latest location error:', error);
      return errorResponse(res, 500, 'Failed to retrieve latest location');
    }
  }

  /**
   * Get location history for a device
   */
  async getLocationHistory(req, res) {
    try {
      const { imei } = req.params;
      const { startDate, endDate, limit = 10000, sort = 'desc' } = req.query;

      // Check device ownership
      const device = await Device.findOne({ imei });
      
      if (!device) {
        return errorResponse(res, 404, 'Device not found');
      }

      if (
        req.userRole !== 'admin' &&
        req.userRole !== 'superadmin' &&
        device.owner &&
        device.owner.toString() !== req.userId.toString()
      ) {
        return errorResponse(res, 403, 'Access denied');
      }

      const locations = await Location.getHistory(imei, startDate, endDate, parseInt(limit), sort);

      return successResponse(res, 200, 'Location history retrieved successfully', {
        imei,
        count: locations.length,
        locations,
      });
    } catch (error) {
      logger.error('Get location history error:', error);
      return errorResponse(res, 500, 'Failed to retrieve location history');
    }
  }

  /**
   * Get locations within a radius
   */
  async getLocationsInRadius(req, res) {
    try {
      const { latitude, longitude, radius } = req.query;

      // Get all devices user can access
      let deviceQuery = {};
      if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        deviceQuery.owner = req.userId;
      }

      const userDevices = await Device.find(deviceQuery).select('imei');
      const imeis = userDevices.map(d => d.imei);

      // Get locations within radius
      const locations = await Location.getWithinRadius(
        parseFloat(longitude),
        parseFloat(latitude),
        parseFloat(radius)
      );

      // Filter by user's devices
      const filteredLocations = locations.filter(loc => imeis.includes(loc.imei));

      return successResponse(res, 200, 'Locations retrieved successfully', {
        center: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
        radius: parseFloat(radius),
        count: filteredLocations.length,
        locations: filteredLocations,
      });
    } catch (error) {
      logger.error('Get locations in radius error:', error);
      return errorResponse(res, 500, 'Failed to retrieve locations');
    }
  }

  /**
   * Get all latest locations for all devices
   */
  async getAllLatestLocations(req, res) {
    try {
      // Get all devices user can access
      let deviceQuery = {};
      if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        deviceQuery.owner = req.userId;
      }

      const devices = await Device.find(deviceQuery).select('imei name model');

      // Get latest location for each device
      const locationsPromises = devices.map(async (device) => {
        const location = await Location.getLatestByImei(device.imei);
        return {
          device: {
            imei: device.imei,
            name: device.name,
            model: device.model,
          },
          location,
        };
      });

      const results = await Promise.all(locationsPromises);
      
      // Filter out devices without location data
      const devicesWithLocation = results.filter(r => r.location !== null);

      return successResponse(res, 200, 'Latest locations retrieved successfully', {
        count: devicesWithLocation.length,
        total: devices.length,
        data: devicesWithLocation,
      });
    } catch (error) {
      logger.error('Get all latest locations error:', error);
      return errorResponse(res, 500, 'Failed to retrieve latest locations');
    }
  }

  /**
   * Manually create a location (for testing)
   */
  async createLocation(req, res) {
    try {
      const { imei, latitude, longitude, speed, course, altitude, accuracy, timestamp, gpsStatus, satellites } = req.body;

      // Check device ownership
      const device = await Device.findOne({ imei });
      
      if (!device) {
        return errorResponse(res, 404, 'Device not found');
      }

      if (
        req.userRole !== 'admin' &&
        req.userRole !== 'superadmin' &&
        device.owner &&
        device.owner.toString() !== req.userId.toString()
      ) {
        return errorResponse(res, 403, 'Access denied');
      }

      const location = new Location({
        imei,
        latitude,
        longitude,
        speed,
        course,
        altitude,
        accuracy,
        timestamp: timestamp || new Date(),
        gpsStatus,
        satellites,
      });

      await location.save();

      logger.info(`Manual location created for ${imei}`);

      return successResponse(res, 201, 'Location created successfully', { location });
    } catch (error) {
      logger.error('Create location error:', error);
      return errorResponse(res, 500, 'Failed to create location');
    }
  }

  /**
   * Delete old locations
   */
  async deleteOldLocations(req, res) {
    try {
      const { days = 30 } = req.query;

      // Only admins can delete old locations
      if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return errorResponse(res, 403, 'Only administrators can delete old locations');
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

      const result = await Location.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      logger.info(`Deleted ${result.deletedCount} old locations (older than ${days} days)`);

      return successResponse(res, 200, 'Old locations deleted successfully', {
        deletedCount: result.deletedCount,
        cutoffDate,
      });
    } catch (error) {
      logger.error('Delete old locations error:', error);
      return errorResponse(res, 500, 'Failed to delete old locations');
    }
  }

  /**
   * Delete all locations for a device
   */
  async deleteDeviceLocations(req, res) {
    try {
      const { imei } = req.params;

      // Check device ownership
      const device = await Device.findOne({ imei });
      
      if (!device) {
        return errorResponse(res, 404, 'Device not found');
      }

      if (
        req.userRole !== 'admin' &&
        req.userRole !== 'superadmin' &&
        device.owner &&
        device.owner.toString() !== req.userId.toString()
      ) {
        return errorResponse(res, 403, 'Access denied');
      }

      const result = await Location.deleteMany({ imei });

      logger.info(`Deleted ${result.deletedCount} locations for device ${imei}`);

      return successResponse(res, 200, 'Device locations deleted successfully', {
        imei,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      logger.error('Delete device locations error:', error);
      return errorResponse(res, 500, 'Failed to delete device locations');
    }
  }
}

module.exports = new LocationController();
