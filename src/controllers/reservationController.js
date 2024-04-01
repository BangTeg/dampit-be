const { Reservations, Users, Vehicles } = require('../../db/models');
const { Op } = require('sequelize');
const { handleError } = require('../middlewares/errorHandler');
const { mailOptions } = require('../configs/emailConfig');
const { sendEmail } = require('../utils/nodemailer');
const { crudController } = require('../utils/crud');

const fs = require('fs');
const ejs = require('ejs');

const attributes = ["id", "pickUp", "dropOff", "passengers", "institution", "unit", "pickDate", "dropDate", "status", "totalPrice", "isOvertime", "overtimeHour", "totalPriceAfterOvertime", "createdAt", "updatedAt"];
const includeUser = {
    model: Users,
    as: 'Users',
    attributes: ["id", "username", "firstName", "lastName", "email", "role", "gender", "avatar", "address", "contact", "ktp"],
};

const includeVehicle = {
    model: Vehicles,
    as: 'Vehicles',
    attributes: ["id", "name", "price", "capacity", "overtime"],
};

const include = [includeUser, includeVehicle];

const readEmailNotificationTemplate = (status) => fs.readFileSync(`src/views/emails/emailNotification/${status}.ejs`, { encoding: 'utf-8' });

const readReservationStatusEmailTemplate = (status) => fs.readFileSync(`src/views/emails/reservationStatus/${status}Status.ejs`, { encoding: 'utf-8' });

const getEmailTemplateByStatus = (status) => {
    const template = readReservationStatusEmailTemplate(status);
    if (!template) {
        throw new Error(`Invalid status: ${status}`);
    }
    return template;
};

module.exports = {
    includeUser,
    includeVehicle,
    attributes,

    // Get All Reservations data with sort filter: Data start from pending status, and order by createdAt ASCENDING
    getAll: async (req, res) => {
        try {
            const { page, limit } = req.query;
            const pageOptions = { page: parseInt(page) || 1, limit: parseInt(limit) || 10 };

            const pendingReservations = await Reservations.findAndCountAll({
                where: { status: "pending" },
                include,
                attributes,
                order: [["createdAt", "ASC"]],
                offset: (pageOptions.page - 1) * pageOptions.limit,
                limit: pageOptions.limit,
            });

            const otherReservations = await Reservations.findAndCountAll({
                where: { status: { [Op.not]: "pending" } },
                include,
                attributes,
                order: [["createdAt", "DESC"]],
                offset: (pageOptions.page - 1) * pageOptions.limit,
                limit: pageOptions.limit,
            });

            const mergedReservations = pendingReservations.rows.concat(otherReservations.rows);
            
            return res.status(200).json({
                code: 200,
                status: "OK",
                message: 'Success getting paginated Reservations(s)',
                data: {
                    rows: mergedReservations,
                    totalRows: pendingReservations.count + otherReservations.count,
                    totalPages: Math.ceil((pendingReservations.count + otherReservations.count) / pageOptions.limit),
                    currentPage: pageOptions.page,
                },
            });
        } catch (error) {
            return handleError(res, error);
        }
    },

    // Get Reservation data by ID
    getById: crudController.getById(Reservations, { include }),

    getByUserId: async (req, res) => {
        const { id } = req.params;
        return await crudController.getAll(Reservations, {
            where: { userId: id },
            include,
            attributes,
            paginated: true,
        })(req, res);
    },
    
    getReservationsByUserToken: async (req, res) => {
        const { id } = req.user;
        return await crudController.getAll(Reservations, {
            where: { userId: id },
            include,
            attributes,
            paginated: true,
        })(req, res);
    },

    getReservationsByDateRange: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;

            // Check if startDate and endDate are provided
            if (!startDate || !endDate) {
                return handleError (res, {
                    status: 400,
                    message: "Please provide 'startDate' and 'endDate' query parameters.",
                });
            }

            // Convert startDate and endDate to Date objects
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);

            // Check if startDate is before or equal to endDate
            if (startDateObj > endDateObj) {
                return handleError (res, {
                    status: 400,
                    message: "'startDate' must be before or equal to 'endDate'.",
                });
            }

            // Additional validation for valid date values
            if (isNaN(startDateObj) || isNaN(endDateObj)) {
                return handleError (res, {
                    status: 400,
                    message: "Please provide valid 'startDate' and 'endDate' query parameters.",
                });
            }

            const { page, limit } = req.query;
            const pageOptions = { page: parseInt(page) || 1, limit: parseInt(limit) || 10 };

            const { count, rows } = await Reservations.findAndCountAll({
                where: { createdAt: { [Op.between]: [startDateObj, endDateObj] } },
                include,
                attributes: ["id", "pickUp", "dropOff", "passengers", "institution", "unit", "pickDate", "dropDate", "status", "totalPrice", "createdAt", "updatedAt"],
                offset: (pageOptions.page - 1) * pageOptions.limit,
                limit: pageOptions.limit,
                order: [["createdAt", "DESC"]],
            });

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Reservations not found within the specified date range.' });
            }

            const totalPages = Math.ceil(count / pageOptions.limit);
            const currentPage = pageOptions.page;

            return res.status(200).json({
                code: 200,
                status: "OK",
                message: 'Success getting paginated Reservations(s)',
                data: {
                    rows,
                    totalRows: count,
                    totalPages,
                    currentPage,
                },
            });
        } catch (error) {
            return handleError(res, error);
        }
    },

    getByVehicleId: async (req, res) => {
        const { id } = req.params;
        return await crudController.getAll(Reservations, {
            where: { vehicleId: id },
            include,
            attributes,
            paginated: true,
        })(req, res);
    },

    getByReservationStatus: async (req, res) => {
        const { status } = req.params;

        // Validate status parameter
        if (!status || !['pending', 'approved', 'rejected', 'finished', 'cancelled'].includes(status)) {
            return handleError(res, {
                status: 400,
                message: "Please provide a valid 'status' parameter.",
            });
        }

        return await crudController.getAll(Reservations, {
            where: { status },
            include,
            attributes,
            paginated: true,
        })(req, res);
    },

    create: async (req, res) => {
        try {
            const { vehicleId, pickUp, dropOff, passengers, institution, unit, pickDate, dropDate } = req.body;
            const { id: userId } = req.user;

            // Validate userId and vehicleId parameters
            if (!userId || !vehicleId) {
                return handleError(res, {
                    status: 400,
                    message: "Please provide valid 'userId' and 'vehicleId' parameters.",
                });
            }

            // Validate other parameters
            const requiredParams = ['pickUp', 'dropOff', 'passengers', 'institution', 'unit', 'pickDate', 'dropDate'];
            if (requiredParams.some(param => !req.body[param])) {
                return handleError(res, {
                    status: 400,
                    message: `Please provide valid '${requiredParams.join("', '")}' parameters.`,
                });
            }

            // Fetch vehicle data
            const vehicle = await Vehicles.findByPk(vehicleId, { attributes: ["id", "name", "price", "capacity", "overtime"] });

            // Calculate total price based on vehicle price, unit, and rental duration (in days)
            const rentalDuration = Math.ceil((new Date(dropDate) - new Date(pickDate)) / (1000 * 60 * 60 * 24));
            const totalPrice = vehicle.price * unit * rentalDuration;

            // Create reservation data
            const reservation = await Reservations.create({ userId, vehicleId, pickUp, dropOff, passengers, institution, unit, pickDate, dropDate, totalPrice, isOvertime: 0, totalPriceAfterOvertime: 0 });

            // Fetch user data
            const user = await Users.findByPk(userId, { attributes: ["id", "username", "firstName", "lastName", "email", "contact", "address", "role"] });

            // Fetch admin users
            const adminUsers = await Users.findAll({ where: { role: 'admin' }, attributes: ["id", "username", "firstName", "lastName", "email", "contact", "address"] });

            // Send email notification to all admin users
            const emailPromises = adminUsers.map(async (admin) => {
                const emailerResult = await sendEmail({
                    ...mailOptions,
                    subject: mailOptions.subjectPrefix + "New Reservation",
                    to: admin.email,
                    html: ejs.render(readEmailNotificationTemplate('orderNotification'), { user, vehicle, reservation }),
                });

                return emailerResult.success;
            });

            // Wait for all email promises to resolve
            const emailResults = await Promise.allSettled(emailPromises);

            // If any email sending fails, log an error
            if (emailResults.some((result) => result.status === 'rejected')) {
                const failedEmailPromises = emailResults.filter((result) => result.status === 'rejected');
                console.error("Error sending email notifications");
                console.error("Failed Email Promises:", failedEmailPromises);  // Log failed email promises for debugging
                return res.status(500).json({ code: 500, status: "Internal Server Error", message: "Failed creating reservation and sending notification emails." });
            }

            // Log success message
            console.log("Reservation created successfully and notifications sent.");

            return res.status(200).json({ code: 200, status: "OK", message: "Success creating reservation and sending notification emails.", data: reservation });
        } catch (error) {
            console.error("Error in reservation creation:", error);
            return handleError(res, error);
        }
    },

    // Update reservation status by admin user only (approved, rejected, finished)
    adminUpdateReservationStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, overtimeHour } = req.body;

            let message = '';

            // Validate status parameter
            if (!status || !['approved', 'rejected', 'finished'].includes(status)) {
                return handleError(res, {
                    status: 400,
                    message: "Please provide a valid 'status' parameter.",
                });
            }

            console.log(overtimeHour);
            
            if (status === 'finished') {
                if ( overtimeHour < 0) {
                    return handleError(res, {
                        status: 400,
                        message: "Please provide a valid 'overtimeHour' parameter as a non-negative integer",
                    });
                }
            }

            // Fetch reservation data
            const reservation = await Reservations.findByPk(id, { include });

            // Check if reservation exists
            if (!reservation) {
                return handleError(res, {
                    status: 404,
                    message: "Reservation not found.",
                });
            }

            // Check if the reservation status is already not 'pending'
            if (reservation.status !== 'pending' && status !== 'finished') {
                return handleError(res, {
                    status: 400,
                    message: "Reservation status cannot be updated because it is not in 'pending' status.",
                });
            }

            // Check if the reservation status is already not 'approved' and 'finished'
            if (reservation.status !== 'approved' && status === 'finished') {
                return handleError(res, {
                    status: 400,
                    message: "Reservation status cannot be updated to 'finished' because it is not in 'approved' status.",
                });
            }

            // Update reservation status
            if (status === 'finished') {
                // Check if overtimeHour is provided
                if (overtimeHour === undefined || overtimeHour === null || overtimeHour === '') {
                    return handleError(res, {
                        status: 400,
                        message: "Please provide 'overtimeHour' in the request body when updating reservation status to 'finished'.",
                    });
                }

                const vehicle = await Vehicles.findByPk(reservation.vehicleId);
                const newTotalPrice = reservation.totalPrice + (reservation.unit * (vehicle.overtime * overtimeHour));
                const isOvertime = overtimeHour !== 0 ? 1 : 0; // If overtimeHour is not 0, then isOvertime is 1

                await Reservations.update({ status, finishedAt: new Date(), totalPriceAfterOvertime: newTotalPrice, isOvertime: isOvertime, overtimeHour: overtimeHour }, { where: { id } });
                message = 'FINISHED';
            } else if (status === 'rejected') {
                // Update status to rejected
                await Reservations.update({ status: 'rejected' }, { where: { id } });
                message = 'REJECTED';
            } else {
                // For 'approved' and 'rejected' status, only update status
                // Set isOvertime and totalPriceAfterOvertime to 0 when changing from 'pending' to 'approved'
                await Reservations.update({ status, isOvertime: 0, totalPriceAfterOvertime: 0 }, { where: { id } });
                message = status.toUpperCase();
            }

            // Fetch user data
            const user = await Users.findByPk(reservation.userId, { attributes: ["id", "username", "firstName", "lastName", "email", "contact", "address", "role"] });

            // Send email notification to the user
            const emailerResult = await sendEmail({
                ...mailOptions,
                subject: mailOptions.subjectPrefix + `Dampit Reservation Status Update: ${message}`,
                to: user.email,
                html: ejs.render(getEmailTemplateByStatus(status), { user, vehicle: reservation.Vehicles, reservation }),
            });

            // Check if the email sending was successful
            if (!emailerResult.success) {
                console.error("Error sending email notification");
                return handleError(res, {
                    status: 500,
                    message: "Failed updating reservation status and sending notification email.",
                });
            }

            // Fetch updated reservation data
            const updatedReservation = await Reservations.findByPk(id, { include });


            // Log success message
            console.log(`Reservation status updated to ${message} and notification email sent.`);

            return res.status(200).json({
                code: 200,
                status: "OK",
                message: `Reservation status updated to ${message} and notification email sent.`,
                data: updatedReservation,
            });
        } catch (error) {
            console.error("Error updating reservation status:", error);
            return handleError(res, error);
        }
    },

    userCancelStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { id: tokenUserId } = req.user; // Get user ID from token

            // Fetch reservation data
            const reservation = await Reservations.findByPk(id, { include });

            // Check if reservation exists
            if (!reservation) {
                return handleError(res, {
                    status: 404,
                    message: "Reservation not found.",
                });
            }

            // Check if the user has the correct permissions
            if (tokenUserId !== reservation.userId) {
                return handleError(res, {
                    status: 403,
                    message: "You are not authorized to cancel this reservation.",
                });
            }

            // Return error if reservation status is not 'pending'
            if (reservation.status !== 'pending') {
                return handleError(res, {
                    status: 400,
                    message: "This reservation cannot be cancelled.",
                });
            }

            // Update reservation status
            await Reservations.update({ status: 'cancelled' }, { where: { id } });

            // Fetch user data
            const user = await Users.findByPk(reservation.userId, { attributes: ["id", "username", "firstName", "lastName", "email", "contact", "address", "role"] });

            // Fetch admin users
            const adminUsers = await Users.findAll({ where: { role: 'admin' }, attributes: ["id", "username", "firstName", "lastName", "email", "contact", "address"] });

            // Send email notification to all admin users
            const emailPromises = adminUsers.map(async (admin) => {
                const emailerResult = await sendEmail({
                    ...mailOptions,
                    subject: mailOptions.subjectPrefix + "Reservation Status Update: CANCELLED",
                    to: admin.email,
                    html: ejs.render(readReservationStatusEmailTemplate('cancelled'), { user, vehicle: reservation.Vehicles, reservation }),
                });

                return emailerResult.success;
            });

            // Wait for all email promises to resolve
            const emailResults = await Promise.allSettled(emailPromises);

            // If any email sending fails, log an error
            if (emailResults.some((result) => result.status === 'rejected')) {
                const failedEmailPromises = emailResults.filter((result) => result.status === 'rejected');
                console.error("Error sending email notifications");
                console.error("Failed Email Promises:", failedEmailPromises);

                return handleError(res, {
                    status: 500,
                    message: "Failed updating reservation status and sending notification emails.",
                });
            }

            // Fetch updated reservation data
            const updatedReservation = await Reservations.findByPk(id, { include });

            // Log success message
            console.log("Reservation status updated to CANCELLED and notifications sent.");

            return res.status(200).json({
                code: 200,
                status: "OK",
                message: "Success updating reservation status and sending notification emails.",
                data: updatedReservation,
            });
        } catch (error) {
            console.error("Error updating reservation status:", error);
            return handleError(res, error);
        }
    },

    update: crudController.update(Reservations, {
        include,
    }),

    delete: crudController.delete(Reservations),
};