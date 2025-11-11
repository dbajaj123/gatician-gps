const Joi = require('joi');

/**
 * Validation schemas for user operations
 */
const userValidation = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    role: Joi.string().valid('user', 'admin').optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).optional(),
    email: Joi.string().email().optional(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
  }),
};

/**
 * Validation schemas for device operations
 */
const deviceValidation = {
  create: Joi.object({
    imei: Joi.string().pattern(/^[0-9]{15,16}$/).required(),
    name: Joi.string().max(100).optional(),
    model: Joi.string().max(50).optional(),
    metadata: Joi.object().optional(),
  }),

  update: Joi.object({
    name: Joi.string().max(100).optional(),
    model: Joi.string().max(50).optional(),
    isActive: Joi.boolean().optional(),
    metadata: Joi.object().optional(),
  }),

  imei: Joi.object({
    imei: Joi.string().pattern(/^[0-9]{15,16}$/).required(),
  }),
};

/**
 * Validation schemas for location operations
 */
const locationValidation = {
  create: Joi.object({
    imei: Joi.string().pattern(/^[0-9]{15,16}$/).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    speed: Joi.number().min(0).optional(),
    course: Joi.number().min(0).max(360).optional(),
    altitude: Joi.number().optional(),
    accuracy: Joi.number().min(0).optional(),
    timestamp: Joi.date().iso().required(),
    gpsStatus: Joi.string().valid('valid', 'invalid', 'unknown').optional(),
    satellites: Joi.number().min(0).optional(),
  }),

  query: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    limit: Joi.number().min(1).max(1000).optional(),
  }),

  radius: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().min(0).max(10000).required(),
  }),
};

/**
 * Validation schemas for pagination
 */
const paginationValidation = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

module.exports = {
  userValidation,
  deviceValidation,
  locationValidation,
  paginationValidation,
};
