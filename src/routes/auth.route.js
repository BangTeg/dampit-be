const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// require('../config/googleOAuth');

// Route to login
router.post('/login', authController.login);

// Route to register
router.post('/register', authController.userRegister);

// Route to admin register
router.post('/admin-register', authController.adminRegister);

// Route to logout
router.post('/logout', authController.logout);

module.exports = router;