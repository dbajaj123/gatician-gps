const { User } = require('../models');
const tokenService = require('../utils/tokenService');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../config/logger');

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res) {
    try {
      const { username, email, password, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      
      if (existingUser) {
        if (existingUser.email === email) {
          return errorResponse(res, 409, 'Email already registered');
        }
        return errorResponse(res, 409, 'Username already taken');
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        role: role || 'user',
      });

      await user.save();

      // Generate tokens
      const tokens = tokenService.generateTokenPair(user._id, user.role);

      // Save refresh token
      user.refreshToken = tokens.refreshToken;
      await user.save();

      logger.info(`New user registered: ${user.email}`);

      return successResponse(res, 201, 'User registered successfully', {
        user: user.toJSON(),
        tokens,
      });
    } catch (error) {
      logger.error('Registration error:', error);
      return errorResponse(res, 500, 'Failed to register user');
    }
  }

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user with password field
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return errorResponse(res, 401, 'Invalid email or password');
      }

      // Check if account is active
      if (!user.isActive) {
        return errorResponse(res, 403, 'Account is inactive. Please contact support.');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return errorResponse(res, 401, 'Invalid email or password');
      }

      // Generate tokens
      const tokens = tokenService.generateTokenPair(user._id, user.role);

      // Save refresh token and update last login
      user.refreshToken = tokens.refreshToken;
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in: ${user.email}`);

      return successResponse(res, 200, 'Login successful', {
        user: user.toJSON(),
        tokens,
      });
    } catch (error) {
      logger.error('Login error:', error);
      return errorResponse(res, 500, 'Failed to login');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return errorResponse(res, 400, 'Refresh token is required');
      }

      // Verify refresh token
      const decoded = tokenService.verifyToken(refreshToken);

      // Find user with refresh token
      const user = await User.findById(decoded.userId).select('+refreshToken');

      if (!user || user.refreshToken !== refreshToken) {
        return errorResponse(res, 401, 'Invalid refresh token');
      }

      if (!user.isActive) {
        return errorResponse(res, 403, 'Account is inactive');
      }

      // Generate new tokens
      const tokens = tokenService.generateTokenPair(user._id, user.role);

      // Save new refresh token
      user.refreshToken = tokens.refreshToken;
      await user.save();

      return successResponse(res, 200, 'Token refreshed successfully', { tokens });
    } catch (error) {
      logger.error('Token refresh error:', error);
      
      if (error.message === 'Token has expired') {
        return errorResponse(res, 401, 'Refresh token has expired. Please login again.');
      }
      
      return errorResponse(res, 401, 'Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(req, res) {
    try {
      const user = await User.findById(req.userId);

      if (user) {
        user.refreshToken = null;
        await user.save();
      }

      logger.info(`User logged out: ${req.userId}`);

      return successResponse(res, 200, 'Logout successful');
    } catch (error) {
      logger.error('Logout error:', error);
      return errorResponse(res, 500, 'Failed to logout');
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      return successResponse(res, 200, 'Profile retrieved successfully', {
        user: req.user,
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      return errorResponse(res, 500, 'Failed to retrieve profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const { username, email } = req.body;
      const user = await User.findById(req.userId);

      if (!user) {
        return errorResponse(res, 404, 'User not found');
      }

      // Check if email/username is taken by another user
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return errorResponse(res, 409, 'Email already in use');
        }
        user.email = email;
      }

      if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return errorResponse(res, 409, 'Username already taken');
        }
        user.username = username;
      }

      await user.save();

      logger.info(`User profile updated: ${user.email}`);

      return successResponse(res, 200, 'Profile updated successfully', {
        user: user.toJSON(),
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      return errorResponse(res, 500, 'Failed to update profile');
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await User.findById(req.userId).select('+password');

      if (!user) {
        return errorResponse(res, 404, 'User not found');
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return errorResponse(res, 401, 'Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);

      return successResponse(res, 200, 'Password changed successfully');
    } catch (error) {
      logger.error('Change password error:', error);
      return errorResponse(res, 500, 'Failed to change password');
    }
  }
}

module.exports = new AuthController();
