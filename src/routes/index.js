const { Router } = require('express');
const router = Router();    
const authRoute = require('./authRoute');
const userRoute = require('./userRoute');
const vehicleRoute = require('./vehicleRoute');
const reservationRoute = require('./reservationRoute');

const {verifiedToken} = require('../middlewares/authentication');    // Import the verifiedToken middleware

// Route to the auth route
router.use('/auth', authRoute);

// Route to the user router
router.use('/user', verifiedToken, userRoute);

// Route to the vehicle router
router.use('/vehicle', verifiedToken, vehicleRoute);

// Route to the reservation router
router.use('/reservation', verifiedToken, reservationRoute);

module.exports = router;