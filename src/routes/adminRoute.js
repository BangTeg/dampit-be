const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { adminToken } = require('../middlewares/authentication');

// Route to get all dashboard data
router.get('/dashboard', adminToken, adminController.getDashboard);

// Route to get total revenue by month and year
router.get("/revenue", adminToken, adminController.getTotalRevenue);

module.exports = router;