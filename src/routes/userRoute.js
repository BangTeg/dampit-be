const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { adminToken, verifiedToken } = require('../middleware/authentication')
const { uploadAvatar, uploadKTP } = require('../config/multerConfig');
const reservationController = require("../controllers/reservationController");

// Route to get all users
router.get('/', adminToken, userController.getAll);

// Route to get all filtered users
router.get('/filter', adminToken, userController.getByFilter);

// Profile Routes for user-related actions
router.get('/profile', verifiedToken, userController.getByToken);
router.get('/profile/:id', adminToken, userController.getById);

// // Route to update a user's profile by token
// router.patch('/profile', verifiedToken, userController.updateByToken);

// // Route to get reservations by the user's token
// router.get("/reservation/token", verifiedToken, reservationController.getReservationsByUserToken);

// // Route to get reservations by UserID
// router.get("/reservation/:id", adminToken, reservationController.getByUserId);

// // Route for user to get reservations
// router.get("/reservation/", reservationController.getByUserId);

// Route to delete a user's and reservations by id
router.delete('/:id', adminToken, userController.delete);


// // Uploading Routes for user-related actions
// // Route to upload avatar
// router.post('/avatar', verifiedToken, uploadAvatar.single('avatar'), userController.uploadAvatar);

// // Route to get a user's avatar by id
// router.get('/avatar/:id', adminToken, userController.getAvatarById);

// // Route to get a user's avatar by token
// router.get('/avatar', verifiedToken, userController.getAvatar);

// // Route to upload KTP
// router.post('/ktp', verifiedToken, uploadCV.single('cv'), userController.uploadKTP);

// // Route to get a user's KTP by token
// router.get('/ktp', verifiedToken, userController.getKTP);

// // Route to get a user's KTP by id
// router.get('/ktp/:id', adminToken, userController.getKTPById);

module.exports = router;
