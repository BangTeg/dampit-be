const { Vehicles, Reservations } = require('../../db/models');
const { Op } = require('sequelize');
const { crudController } = require('../utils/crud');
const { handleError } = require('../middlewares/errorHandler');

const defaultPageLimit = 10;

module.exports = {
    getAll : async (req, res) => {
        const filter = {};
        return await crudController.getAll(Vehicles, {
            where: filter,
            paginated: true,
        })(req, res);
    },

    getAllByName: async (req, res) => {
        try {
            const { name, page, limit } = req.query;
            const filter = {};

            // Validate name parameter
            if (!name) {
                return res.status(400).json({
                    code: 400,
                    status: "Bad Request",
                    message: "Please provide a valid 'name' parameter.",
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

    getById: crudController.getById(Vehicles),
    create: crudController.create(Vehicles),
    update: crudController.update(Vehicles),
    delete: crudController.delete(Vehicles),
};