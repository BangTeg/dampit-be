require('dotenv').config();

const {
  BE_PORT
} = process.env;

const {
  Users,
  Reservations
} = require('../../db/models');

const bcrypt = require('bcrypt');
// const path = require('path');
// const fs = require('fs');
const { handleError } = require('../middlewares/errorHandler');
const { crudController } = require('../utils/crud');
const { Op } = require('sequelize');

const attributes = { exclude: ['password'] };

module.exports = {
  attributes,
  getAll: async (req, res) => {
    return await crudController.getAll(Users, {
      where: {},
      attributes,
      paginated: true,
    })(req, res);
  },
  getById: async (req, res) => {
    const id = req.params.id ?? req.user.id; // Use the ID from the route parameter or token's user Id
    return await crudController.getById(
      Users,
      {
        attributes,
      },
      id
    )(req, res);
  },

  getByToken: async (req, res) => {
    const { user } = req;

    try {
      const userData = await Users.findByPk(user.id, {
        attributes,
      });

      if (!userData) {
        return res.status(404).json({
          code: 404,
          status: "Not Found",
          message: "User not found",
        });
      }

      return res.status(200).json({
        code: 200,
        status: "OK",
        message: "User information retrieved successfully.",
        data: userData,
      });
    } catch (err) {
      return handleError(res, err);
    }
  },

  // Admin Get User data filtered by role, gender, and createdAt with pagination
  getByFilter: async (req, res) => {
    try {
      const { role, gender, startDate, endDate, page, limit } = req.query;

      // Validate and parse date parameters
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;

      // Validate and parse pagination parameters
      const parsedPage = page ? parseInt(page) : 1;
      const parsedLimit = limit ? parseInt(limit) : 10;

      // Validate page and limit parameters
      if (isNaN(parsedPage) || parsedPage < 1) {
        return res.status(400).json({
          code: 400,
          status: 'Bad Request',
          message: 'Invalid page parameter. Must be a positive integer.',
        });
      }

      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return res.status(400).json({
          code: 400,
          status: 'Bad Request',
          message: 'Invalid limit parameter. Must be a positive integer.',
        });
      }

      // Validate date parameters
      if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
        return res.status(400).json({
          code: 400,
          status: 'Bad Request',
          message: 'Invalid date range. startDate must be before or equal to endDate.',
        });
      }

      // Build the filter object based on the provided parameters
      const filter = {};
      if (role) filter.role = role;
      if (gender) filter.gender = gender;
      if (parsedStartDate && parsedEndDate) {
        filter.createdAt = { [Op.between]: [parsedStartDate, parsedEndDate] };
      }

      const options = {
        paginated: true,
        page: parsedPage,
        limit: parsedLimit,
        where: filter,
        attributes,
      };

      const result = await crudController.getAll(Users, options)(req, res);
      return result;
    } catch (err) {
      return handleError(res, err);
    }
  },
  
  update: async (req, res) => {
    const id = req.params.id ?? req.user.id; // Use the ID from the route parameter or token's user Id
    // const id = req.params.id; // Use the ID from the route parameter
    if (req.user.role !== "admin")
      if (id != req.user.id) {
        return res.status(403).json({
          code: 403,
          status: "Forbidden",
          message: "You do not have permission to edit other's profile.",
        });
      }
    const data = req.body;
    if (data.password) {
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(data.password, salt);
    }
    return await crudController.update(
      Users,
      { attributes },
      id,
      data
    )(req, res);
  },

  // Route to update a user's profile by token
  updateByToken: async (req, res) => {
    const { user } = req;
    const data = req.body;

    // Check if the user is trying to update other's profile
    if (data.id && data.id != user.id) {
      return res.status(403).json({
        code: 403,
        status: "Forbidden",
        message: "You do not have permission to edit other's profile.",
      });
    }

    // Check if the user is trying to update their password
    if (data.password) {
      // Hash the new password
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(data.password, salt);
    }

    // Update the user's profile
    return await crudController.update(
      Users,
      { attributes },
      user.id,
      data
    )(req, res);
  },

  // Delete a user's and reservations by ID
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await Users.findByPk(id);

      if (!user) {
        return res.status(404).json({
          code: 404,
          status: "Not Found",
          message: "User not found",
        });
      }

      // // Remove the user's avatar file if it exists in Google Cloud Storage
      // 


      // // Remove the user's KTP file if it exists in Google Cloud Storage
      // 

      // Get reservations associated with the user
      const reservations = await Reservations.findAll({ where: { UserId: id } });

      // Remove the user's applications
      await Reservations.destroy({ where: { UserId: id } });

      // Remove the user
      await user.destroy();

      return res.status(200).json({
        code: 200,
        status: "OK",
        message: "User's whole data deleted successfully",
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        reservations: reservations,
      });
    } catch (err) {
      return handleError(res, err);
    }
  },
};
