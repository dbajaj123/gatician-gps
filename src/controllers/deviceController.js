const { Device } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const logger = require('../config/logger');

class DeviceController {
  /**
   * Get all devices
   */
  async getAllDevices(req, res) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;
      
      const query = {};
      
      // If not admin, only show user's own devices
      if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        query.owner = req.userId;
      }

      // Search filter
      if (search) {
        query.$or = [
          { imei: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [devices, total] = await Promise.all([
        Device.find(query)
          .populate('owner', 'username email')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Device.countDocuments(query),
      ]);

      return paginatedResponse(
        res,
        200,
        'Devices retrieved successfully',
        devices,
        {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        }
      );
    } catch (error) {
      logger.error('Get all devices error:', error);
      return errorResponse(res, 500, 'Failed to retrieve devices');
    }
  }

  /**
   * Get device by ID
   */
  async getDeviceById(req, res) {
    try {
      const { id } = req.params;
      
      const device = await Device.findById(id).populate('owner', 'username email');

      if (!device) {
        return errorResponse(res, 404, 'Device not found');
      }

      // Check ownership
      if (
        req.userRole !== 'admin' &&
        req.userRole !== 'superadmin' &&
        device.owner &&
        device.owner._id.toString() !== req.userId.toString()
      ) {
        return errorResponse(res, 403, 'Access denied');
      }

      return successResponse(res, 200, 'Device retrieved successfully', { device });
    } catch (error) {
      logger.error('Get device by ID error:', error);
      return errorResponse(res, 500, 'Failed to retrieve device');
    }
  }

  /**
   * Get device by IMEI
   */
  async getDeviceByImei(req, res) {
    try {
      const { imei } = req.params;
      
      const device = await Device.findOne({ imei }).populate('owner', 'username email');

      if (!device) {
        return errorResponse(res, 404, 'Device not found');
      }

      // Check ownership
      if (
        req.userRole !== 'admin' &&
        req.userRole !== 'superadmin' &&
        device.owner &&
        device.owner._id.toString() !== req.userId.toString()
      ) {
        return errorResponse(res, 403, 'Access denied');
      }

      return successResponse(res, 200, 'Device retrieved successfully', { device });
    } catch (error) {
      logger.error('Get device by IMEI error:', error);
      return errorResponse(res, 500, 'Failed to retrieve device');
    }
  }

  /**
   * Create new device
   */
  async createDevice(req, res) {
    try {
      const { imei, name, model, metadata } = req.body;

      // Check if device already exists
      const existingDevice = await Device.findOne({ imei });
      
      if (existingDevice) {
        return errorResponse(res, 409, 'Device with this IMEI already exists');
      }

      // Create device
      const device = new Device({
        imei,
        name: name || `Device ${imei.substring(0, 8)}`,
        model,
        owner: req.userId,
        metadata,
      });

      await device.save();

      logger.info(`New device created: ${imei} by user ${req.userId}`);

      return successResponse(res, 201, 'Device created successfully', { device });
    } catch (error) {
      logger.error('Create device error:', error);
      return errorResponse(res, 500, 'Failed to create device');
    }
  }

  /**
   * Update device
   */
  async updateDevice(req, res) {
    try {
      const { id } = req.params;
      const { name, model, isActive, metadata } = req.body;

      const device = await Device.findById(id);

      if (!device) {
        return errorResponse(res, 404, 'Device not found');
      }

      // Check ownership
      if (
        req.userRole !== 'admin' &&
        req.userRole !== 'superadmin' &&
        device.owner &&
        device.owner.toString() !== req.userId.toString()
      ) {
        return errorResponse(res, 403, 'Access denied');
      }

      // Update fields
      if (name !== undefined) device.name = name;
      if (model !== undefined) device.model = model;
      if (isActive !== undefined) device.isActive = isActive;
      if (metadata !== undefined) device.metadata = metadata;

      await device.save();

      logger.info(`Device updated: ${device.imei}`);

      return successResponse(res, 200, 'Device updated successfully', { device });
    } catch (error) {
      logger.error('Update device error:', error);
      return errorResponse(res, 500, 'Failed to update device');
    }
  }

  /**
   * Delete device
   */
  async deleteDevice(req, res) {
    try {
      const { id } = req.params;

      const device = await Device.findById(id);

      if (!device) {
        return errorResponse(res, 404, 'Device not found');
      }

      // Check ownership
      if (
        req.userRole !== 'admin' &&
        req.userRole !== 'superadmin' &&
        device.owner &&
        device.owner.toString() !== req.userId.toString()
      ) {
        return errorResponse(res, 403, 'Access denied');
      }

      await device.deleteOne();

      logger.info(`Device deleted: ${device.imei}`);

      return successResponse(res, 200, 'Device deleted successfully');
    } catch (error) {
      logger.error('Delete device error:', error);
      return errorResponse(res, 500, 'Failed to delete device');
    }
  }

  /**
   * Get device statistics
   */
  async getDeviceStats(req, res) {
    try {
      const query = {};
      
      // If not admin, only count user's devices
      if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        query.owner = req.userId;
      }

      const [total, active, online, offline] = await Promise.all([
        Device.countDocuments(query),
        Device.countDocuments({ ...query, isActive: true }),
        Device.countDocuments({ ...query, connectionStatus: 'online' }),
        Device.countDocuments({ ...query, connectionStatus: 'offline' }),
      ]);

      return successResponse(res, 200, 'Device statistics retrieved successfully', {
        stats: {
          total,
          active,
          inactive: total - active,
          online,
          offline,
          unknown: total - online - offline,
        },
      });
    } catch (error) {
      logger.error('Get device stats error:', error);
      return errorResponse(res, 500, 'Failed to retrieve device statistics');
    }
  }
}

module.exports = new DeviceController();
