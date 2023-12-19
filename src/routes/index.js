const { Router } = require('express');
const router = Router();    
const authRoute = require('./authRoute');
const userRoute = require('./userRoute');
const {verifiedToken} = require('../middleware/authentication');    // Import the verifiedToken middleware

// Route to the auth route
router.use('/auth', authRoute);

// Route to the user router
router.use('/user', verifiedToken, userRoute);

module.exports = router;