const express = require('express');
const googleOAuthController = require('../controllers/googleOAuthController');

require('../configs/passport');

const router = express.Router();

// Route to initiate Google OAuth login
router.get('/login', googleOAuthController.googleLogin);

// Protected route to initiate Google OAuth login
router.get('/protected', googleOAuthController.googleProtected);

// Route called when Google authentication fails
router.get('/failure', googleOAuthController.googleFailure);

// Test endpoint for authentication with Google
router.get('/test', googleOAuthController.testGoogleAuth);

module.exports = router;
