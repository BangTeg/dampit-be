const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { adminToken } = require('../middlewares/authentication')
const { upload } = require('../utils/multer');

// Route to get all users
router.get('/', adminToken, userController.getAll);

// Route to get all filtered users
router.get('/filter', adminToken, userController.getByFilter);

// Profile Routes for user-related actions
router.get('/profile', userController.getByToken);
router.get('/profile/:id', adminToken, userController.getById);

// Route to update a user's profile
router.put('/profile', userController.updateByToken);

// Route to delete a user's and reservations by id
router.delete('/:id', adminToken, userController.delete);

// Route to upload avatar image to Google Cloud Storage and update the user's avatar URL in the database by token
router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);

// Route to get a user's avatar by id
router.get('/avatar/:id', adminToken, userController.getAvatarById);

// Route to get a user's avatar by token
router.get('/avatar', userController.getAvatar);

// Route to upload KTP
router.post('/ktp', upload.single('ktp'), userController.uploadKTP);

// Route to get a user's KTP by token
router.get('/ktp', userController.getKTP);

// Route to get a user's KTP by id
router.get('/ktp/:id', adminToken, userController.getKTPById);

module.exports = router;
