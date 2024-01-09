const { Reservations, Users, Vehicles } = require('../../db/models');
const { Op } = require('sequelize');
const { handleError } = require('../middlewares/errorHandler');
const { mailOptions } = require('../configs/emailConfig');
const { sendEmail } = require('../utils/nodemailer');
const { crudController } = require('../utils/crud');

const fs = require('fs');
const ejs = require('ejs');

const attributes = ["id", "pickUp", "dropOff", "passengers", "institution", "unit", "pickDate", "dropDate", "status", "totalPrice", "createdAt", "updatedAt"];
const includeUser = {
    model: Users,
    as: 'Users',
    attributes: ["id", "username", "firstName", "lastName", "email", "contact", "address", "ktp"],
};

const includeVehicle = {
    model: Vehicles,
    as: 'Vehicles',
    attributes: ["id", "name", "price", "capacity"],
};

const include = [includeUser, includeVehicle];

const readEmailTemplate = (status) => fs.readFileSync(`src/views/emails/reservationStatus/${status}Status.ejs`, { encoding: 'utf-8' });

const getEmailTemplateByStatus = (status) => {
    const template = readEmailTemplate(status);
    if (!template) {
        throw new Error(`Invalid status: ${status}`);
    }
    return template;
};

module.exports = {
    includeUser,
    includeVehicle,
    attributes,
    getAll: async (req, res) => {
        return await crudController.getAll(Reservations, {
            where: {},
            include,
            paginated: true,
        })(req, res);
    },

    getById: crudController.getById(Reservations, { include }),

    getByUserId: async (req, res) => {
        const { id } = req.params;
        return await crudController.getAll(Reservations, {
            where: { userId: id },
            include: includeVehicle,
            attributes,
            paginated: true,
        })(req, res);
    },
    
    getReservationsByDateRange: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;

            // Check if startDate and endDate are provided
            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'Both startDate and endDate are required.' });
            }

            // Convert startDate and endDate to Date objects
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);

            // Check if startDate is before or equal to endDate
            if (startDateObj > endDateObj) {
                return res.status(400).json({ message: 'startDate must be before or equal to endDate.' });
            }

            // Additional validation for valid date values
            if (isNaN(startDateObj) || isNaN(endDateObj)) {
                return res.status(400).json({ message: 'Invalid date format for startDate or endDate.' });
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
            include: includeUser,
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
                return res.status(400).json({ code: 400, status: "Bad Request", message: "Please provide a valid 'userId' and 'vehicleId' parameter." });
            }

            // Validate other parameters
            const requiredParams = ['pickUp', 'dropOff', 'passengers', 'institution', 'unit', 'pickDate', 'dropDate'];
            if (requiredParams.some(param => !req.body[param])) {
                return res.status(400).json({ code: 400, status: "Bad Request", message: `Please provide valid values for ${requiredParams.join(', ')} parameters.` });
            }

            // Fetch vehicle data
            const vehicle = await Vehicles.findByPk(vehicleId, { attributes: ["id", "name", "price", "capacity"] });
            const rentalDuration = Math.ceil((new Date(dropDate) - new Date(pickDate)) / (1000 * 60 * 60 * 24));
            const totalPrice = vehicle.price * unit * rentalDuration;

            // Create reservation data
            const reservation = await Reservations.create({ userId, vehicleId, pickUp, dropOff, passengers, institution, unit, pickDate, dropDate, totalPrice });

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
                    html: ejs.render(readEmailTemplate('orderNotification'), { user, vehicle, reservation }),
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
            console.error("Error in reservation creation:", error);  // Log the specific error
            return handleError(res, error);
        }
    },
    adminUpdateStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Validate status parameter
            if (!status || !['approved', 'rejected', 'finished'].includes(status)) {
                return res.status(400).json({ code: 400, status: "Bad Request", message: "Please provide a valid 'status' parameter ('approved', 'rejected', or 'finished')." });
            }

            // Fetch reservation data
            const reservation = await Reservations.findByPk(id, { include });

            // Check if reservation exists
            if (!reservation) {
                return res.status(404).json({ code: 404, status: "Not Found", message: "Reservation not found." });
            }

            // Update reservation status
            await Reservations.update({ status }, { where: { id } });

            // Fetch user data
            const user = await Users.findByPk(reservation.userId, { attributes: ["id", "username", "firstName", "lastName", "email", "contact", "address", "role"] });

            // Send email notification to the user
            const emailerResult = await sendEmail({
                ...mailOptions,
                subject: mailOptions.subjectPrefix + `Reservation Status Update: ${status.toUpperCase()}`,
                to: user.email,
                html: ejs.render(getEmailTemplateByStatus(status), { user, vehicle: reservation.Vehicles, reservation }),
            });

            // Check if the email sending was successful
            if (!emailerResult.success) {
                console.error("Error sending email notification");
                return res.status(500).json({ code: 500, status: "Internal Server Error", message: "Failed sending notification email." });
            }

            return res.status(200).json({
                code: 200,
                status: "OK",
                message: `Reservation status updated to ${status.toUpperCase()} and notification email sent.`,
                data: reservation,
            });
        } catch (error) {
            console.error("Error updating reservation status:", error);
            return handleError(res, error);
        }
    },
    userCancelStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { userId: tokenUserId } = req.user;  // Extract userId from the token

            // Fetch reservation data
            const reservation = await Reservations.findByPk(id, { include });

            // Check if reservation exists
            if (!reservation) {
                return res.status(404).json({ code: 404, status: "Not Found", message: "Reservation not found." });
            }

            // Check if the user has the correct permissions
            if (tokenUserId !== reservation.userId) {
                return res.status(403).json({ code: 403, status: "Forbidden", message: "You don't have permission to cancel this reservation." });
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
                    html: ejs.render(readEmailTemplate('cancelledStatus'), { user, vehicle: reservation.Vehicles, reservation }),
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
                return res.status(500).json({ code: 500, status: "Internal Server Error", message: "Failed updating reservation status and sending notification emails." });
            }

            // Log success message
            console.log("Reservation status updated to CANCELLED and notifications sent.");

            return res.status(200).json({
                code: 200,
                status: "OK",
                message: "Success updating reservation status and sending notification emails.",
                data: reservation,
            });
        } catch (error) {
            console.error("Error updating reservation status:", error);
            return handleError(res, error);
        }
    },

    update: crudController.update(Reservations, { include }),

    delete: crudController.delete(Reservations),
};