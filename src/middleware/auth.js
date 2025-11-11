const { User } = require('../models');
const tokenService = require('../utils/tokenService');
const { errorResponse } = require('../utils/response');
const logger = require('../config/logger');

/**
 * Authenticate user with JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const token = tokenService.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return errorResponse(res, 401, 'Authentication required. Please provide a valid token.');
    }

    const decoded = tokenService.verifyToken(token);
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    
    if (!user) {
      return errorResponse(res, 401, 'User not found. Token is invalid.');
    }

    if (!user.isActive) {
      return errorResponse(res, 403, 'Account is inactive. Please contact support.');
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.message === 'Token has expired') {
      return errorResponse(res, 401, 'Token has expired. Please login again.');
    }
    
    if (error.message === 'Invalid token') {
      return errorResponse(res, 401, 'Invalid token. Please login again.');
    }
    
    return errorResponse(res, 401, 'Authentication failed.');
  }
};

/**
 * Authorize based on user roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required.');
    }

    if (!roles.includes(req.userRole)) {
      return errorResponse(
        res,
        403,
        `Access denied. Required role(s): ${roles.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if token is missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = tokenService.extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = tokenService.verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password -refreshToken');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};
