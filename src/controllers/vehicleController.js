const { Vehicles, Reservations, Users } = require('../../db/models');
const { Op } = require('sequelize');
const { crudController } = require('../utils/crud');
const { handleError } = require('../middlewares/errorHandler');

const defaultPageLimit = 10;

const attributes = ["id", "name", "price", "model", "capacity", "include", "area", "parking", "payment", "overtime", "createdAt", "updatedAt"];

const includeUser = {
    model: Users,
    as: 'Users',
    attributes: ["id", "username", "firstName", "lastName", "email", "role", "gender", "avatar", "address", "contact", "ktp"],
};

const includeReservation = {
    model: Reservations,
    as: 'Reservations',
    attributes: ["id", "userId", "vehicleId", "pickUp", "dropOff", "passengers", "institution", "unit", "pickDate", "dropDate", "status", "totalPrice", "finishedAt", "createdAt", "updatedAt"],
};

const include = [includeUser, includeReservation];

module.exports = {
    includeUser,
    includeReservation,
    attributes,
    getAll : async (req, res) => {
        return await crudController.getAll(Vehicles, {
            where: {},
            include,
            paginated: true,
        })(req, res);
    },

    getAllByName: async (req, res) => {
        try {
            const { name, page, limit } = req.query;
            const filter = {};

            // Validate name parameter
            if (!name) {
                return handleError(res, {
                    status: 400,
                    message: 'Name parameter is required',
                });
            }

            filter.name = {
                [Op.like]: `%${name}%`,
            };

            const parsedLimit = parseInt(limit) || defaultPageLimit;
            const parsedPage = parseInt(page) || 1;
            const offset = (parsedPage - 1) * parsedLimit;

            return await crudController.getAll(Vehicles, {
                where: filter,
                paginated: true,
                limit: parsedLimit,
                offset,
            })(req, res);
        } catch (error) {
            return handleError(res, error);
        }
    },

    getById: crudController.getById(Vehicles, {
        include,
    }),

    create: crudController.create(Vehicles),

    update: crudController.update(Vehicles, {
        include,
    }),

    delete: async (req, res) => {
        try {
            const { id } = req.params;

            // Fetch the vehicle along with its reservations
            const vehicle = await Vehicles.findByPk(id, {
            include: [includeReservation],
            });

            if (!vehicle) {
            const ret = {
                code: 404,
                status: "Not Found",
                message: `Vehicle not found, finding ${id}`,
            };
            
            return res.status(404).json(ret);
            }

            // Delete the vehicle and its associated reservations
            await vehicle.destroy({ include: [Reservations] });

            const ret = {
                code: 200,
                status: "OK",
                message: `Success deleting ${Vehicles.name} and associated reservations`,
            };

            return res.status(200).json(ret);
        } catch (err) {
            return handleError(res, err);
        }
        },
};