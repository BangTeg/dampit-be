const { Router } = require('express');
const router = Router();
const authRoute = require('./auth.route');
// const userRoute = require('./user.route');

// const {verifiedToken} = require('../middleware/authentication');

// Route to the auth route
router.use('/auth', authRoute);

// // Route to the user router
// router.use('/user', verifiedToken, userRoute);

module.exports = router;