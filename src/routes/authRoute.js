const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Route to login
router.post('/login', authController.login);

// Route to register
router.post('/register', authController.userRegister);

// Route to admin register
router.post('/adminRegister', authController.adminRegister);

// Route to logout
router.post('/logout', authController.logout);

// Route to reset password
router.post('/reset', authController.initiateResetPassword);

router.post("/reset/:token", authController.verifyResetPasswordEmail);

// Route to verify email
router.get("/verify/:token", authController.verifyRegisterEmail);

module.exports = router;