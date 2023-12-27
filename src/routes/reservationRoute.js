const express = require('express');
const router = express.Router();

const { adminToken, verifiedToken } = require('../middleware/authentication')
const reservationController = require("../controllers/reservationController");


module.exports = router;