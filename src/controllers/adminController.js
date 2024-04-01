const { Users, Vehicles, Reservations } = require('../../db/models');
const { Op } = require('sequelize');
const { crudController } = require('../utils/crud');
const { handleError } = require('../middlewares/errorHandler');

module.exports = {
    // Count all data of Vehicles Unit, Users, Admin, Reservations
    getDashboard: async (req, res) => {
        try {
            const vehicleCount = await Vehicles.count();
            const verifiedUserCount = await Users.count({ where: { isVerified: 'yes' } });
            const adminCount = await Users.count({ where: { role: 'admin' } });
            const notVerifiedUserCount = await Users.count({ where: { isVerified: 'no' } });
            const finishedReservationCount = await Reservations.count({ where: { status: 'finished' } });
            const cancelledReservationCount = await Reservations.count({ where: { status: 'cancelled' } });
            const rejectedReservationCount = await Reservations.count({ where: { status: 'rejected' } });

            return res.status(200).json({
                code: 200,
                status: 'OK',
                message: 'Success getting dashboard data.',
                data: {
                    vehicleCount,
                    verifiedUserCount,
                    adminCount,
                    notVerifiedUserCount,
                    finishedReservationCount,
                    cancelledReservationCount,
                    rejectedReservationCount,
                },
            });
        } catch (error) {
            return handleError(res, error);
        }
    },

    // Get total revenue from all finished reservations (sum of totalPriceAfterOvertime)
    getTotalRevenue: async (req, res) => {
        try {
            const { month, year } = req.query;

            let startDate, endDate;

            // Check if both month and year are provided
            if (month && year) {
                // Construct start date as the first day of the month
                startDate = new Date(`${year}-${month}-01`);
                // Construct end date as the last day of the month
                endDate = new Date(new Date(year, month, 0).toISOString().split('T')[0] + 'T23:59:59');
            } else if (month && !year) {
                // Handle error when only month is provided without year
                return handleError(res, {
                    status: 400,
                    message: "Please provide 'year' parameters.",
                });
            } else {
                // If month is not provided, consider the entire year
                startDate = new Date(`${year}-01-01`);
                endDate = new Date(`${year}-12-31T23:59:59`);
            }

            // Prepare the where clause for the query
            const whereClause = {
                status: 'finished',
            };

            if (startDate && endDate) {
                // Include finishedAt between start date and end date
                whereClause.finishedAt = { [Op.between]: [startDate, endDate] };
            }

            // Calculate total revenue from all finished reservations
            let totalRevenue;

            if (month && year) {
                totalRevenue = await Reservations.sum('totalPriceAfterOvertime', { where: whereClause });
            } else {
                totalRevenue = await Reservations.sum('totalPriceAfterOvertime', { where: { status: 'finished' } });
            }

            // Calculate total count of finished reservations
            let totalFinishedReservations;

            if (month && year) {
                totalFinishedReservations = await Reservations.count({ where: whereClause });
            } else {
                totalFinishedReservations = await Reservations.count({ where: { status: 'finished' } });
            }

            // Return the response with total revenue and additional details
            return res.status(200).json({
                code: 200,
                status: 'OK',
                message: 'Success getting total revenue from finished reservations.',
                data: {
                    totalRevenue: totalRevenue,
                    details: {
                        totalFinishedReservations: totalFinishedReservations || 0,
                        startDate: startDate || 'All time',
                        endDate: endDate || 'All time',
                        month: month || 'All months',
                        year: year || 'All years',
                    },
                },
            });
        } catch (error) {
            // Handle any errors that occur during the process
            return handleError(res, error);
        }
    },
}