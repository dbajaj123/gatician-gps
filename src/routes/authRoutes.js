const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { userValidation } = require('../utils/validation');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, validate(userValidation.register), authController.register);
router.post('/login', authLimiter, validate(userValidation.login), authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validate(userValidation.updateProfile), authController.updateProfile);
router.put('/change-password', authenticate, validate(userValidation.changePassword), authController.changePassword);

module.exports = router;
