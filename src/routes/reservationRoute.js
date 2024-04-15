const express = require('express');
const router = express.Router();
const { adminToken } = require('../middlewares/authentication')
const reservationController = require("../controllers/reservationController");

// Route to get all reservations listed
router.get("/", adminToken, reservationController.getAll);

// Route to get a reservation by ID
router.get("/:id", reservationController.getById);

// Route to get a reservation by User ID
router.get("/user/:id", adminToken, reservationController.getByUserId);

// Route to get reservations by User Token
router.get("/token/user", reservationController.getReservationsByUserToken);

// Route to get reservations by createdAt date range
router.get("/filter/date", adminToken, reservationController.getReservationsByDateRange);

// Route to get reservations by vehicle ID
router.get("/vehicle/:id", adminToken, reservationController.getByVehicleId);

// // Route to get all reservations by status
// router.get("/show/:status", adminToken, reservationController.getByReservationStatus);

// Route to create a new reservation
router.post("/", reservationController.create);

// Route to update an reservation status by ID
router.put("/status/:id", adminToken, reservationController.adminUpdateReservationStatus);

// Route to cancel an reservation by ID
router.put("/cancel/:id", reservationController.userCancelStatus);

// Route to update an reservation by ID
router.put("/:id", adminToken, reservationController.update);

// Route to delete an reservation by ID
router.delete("/:id", adminToken, reservationController.delete);

module.exports = router;