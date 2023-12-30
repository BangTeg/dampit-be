const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { adminToken } = require("../middlewares/authentication");
const reservationController = require("../controllers/reservationController");

// Route to get all Vehicles listed
router.get('/', vehicleController.getAll);

// Route to get all Vehicles by name
router.get('/filter', vehicleController.getAllByName);

// Route to get a Vehicle by ID
router.get('/:id', vehicleController.getById);

// Route to update a Vehicle by ID
router.put("/:id", adminToken, vehicleController.update);

// Route to delete a Vehicle by ID
router.delete("/:id", adminToken, vehicleController.delete);

// // Route to get reservations by VehicleID
// router.get("/reservation/:id", adminToken, reservationController.getByVehicleId);

// // Route to get reservations
// router.get("/reservation", adminToken, reservationController.getByVehicleId);

module.exports = router;
