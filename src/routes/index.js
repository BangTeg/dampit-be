const { Router } = require('express');
const router = Router();    
const authRoute = require('./authRoute');
const googleOAuthRoute = require('./googleOAuthRoute');
const userRoute = require('./userRoute');
const adminRoute = require('./adminRoute');
const vehicleRoute = require('./vehicleRoute');
const reservationRoute = require('./reservationRoute');

const { verifiedToken } = require('../middlewares/authentication');

// Route to the auth route
router.use('/auth', authRoute);

// Route to the google OAuth route
router.use('/googleOAuth', googleOAuthRoute);

// Route to the user router
router.use('/user', verifiedToken, userRoute);

// Route to the vehicle router
router.use('/vehicle', verifiedToken, vehicleRoute);

// Route to the reservation router
router.use('/reservation', verifiedToken, reservationRoute);

// Route to the admin dashboard
router.use('/admin', verifiedToken, adminRoute);

module.exports = router;