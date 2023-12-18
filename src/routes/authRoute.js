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

// Route to reset password
router.post('/reset', authController.resetPassword);
router.post("/reset/:token", authController.resetPassword);

// Route to verify email
// router.post("/verify", authController.verifyEmail);
router.post("/verify/:token", authController.verifyEmail);

module.exports = router;