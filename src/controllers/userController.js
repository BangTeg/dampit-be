require('dotenv').config();

const {
  BE_PORT
} = process.env;

const {
  Users,
  Reservations
} = require('../../db/models');

const bcrypt = require('bcrypt');
const { handleError } = require('../middlewares/errorHandler');
const { crudController } = require('../utils/crud');
const { Op } = require('sequelize');
const { uploadToStorage } = require('../utils/multer');

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

  // Upload avatar image to Google Cloud Storage and update the user's avatar URL in the database by user token
  uploadAvatar: async (req, res) => {
    try {
      const { file } = req;

      if (!file) {
        return res.status(400).json({
          code: 400,
          status: 'Bad Request',
          message: 'No file uploaded',
        });
      }

      // Upload the avatar to Google Cloud Storage
      const avatarUrl = await uploadToStorage(req.file, uploadToStorage.avatarStorageBucket);

      // Update the user's avatar URL in the database
      const userId = req.params.id ?? req.user.id;
      const user = await Users.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          code: 404,
          status: 'Not Found',
          message: 'User not found',
        });
      }

      user.avatar = avatarUrl;
      await user.save();

      return res.status(200).json({
        code: 200,
        status: 'OK',
        message: 'Avatar uploaded successfully',
        avatarUrl,
      });
    } catch (err) {
      return handleError(res, err);
    }
  },

  // Get a user's avatar by ID (accessible only by admin)
  getAvatarById: async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await Users.findByPk(userId, {
        attributes: ['avatar'],
      });

      if (!user) {
        return res.status(404).json({
          code: 404,
          status: 'Not Found',
          message: 'User not found',
        });
      }

      const avatarUrl = user.avatar;

      return res.status(200).json({
        code: 200,
        status: 'OK',
        message: 'Avatar retrieved successfully',
        avatarUrl,
      });
    } catch (err) {
      return handleError(res, err);
    }
  },

  // Get a user's avatar by token
  getAvatar: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await Users.findByPk(userId, {
        attributes: ['avatar'],
      });

      if (!user) {
        return res.status(404).json({
          code: 404,
          status: 'Not Found',
          message: 'User not found',
        });
      }

      const avatarUrl = user.avatar;

      return res.status(200).json({
        code: 200,
        status: 'OK',
        message: 'Avatar retrieved successfully',
        avatarUrl,
      });
    } catch (err) {
      return handleError(res, err);
    }
  },

  // Upload KTP to Google Cloud Storage and update the user's KTP URL in the database by user token
  uploadKTP: async (req, res) => {
    try {
      const { file } = req;

      if (!file) {
        return res.status(400).json({
          code: 400,
          status: 'Bad Request',
          message: 'No file uploaded',
        });
      }

      // Upload the KTP to Google Cloud Storage
      const ktpUrl = await uploadToStorage(req.file, uploadToStorage.ktpStorageBucket);

      // Update the user's KTP URL in the database
      const userId = req.user.id;
      const user = await Users.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          code: 404,
          status: 'Not Found',
          message: 'User not found',
        });
      }

      user.ktp = ktpUrl;
      await user.save();

      return res.status(200).json({
        code: 200,
        status: 'OK',
        message: 'KTP uploaded successfully',
        ktpUrl,
      });
    } catch (err) {
      return handleError(res, err);
    }
  },

  // Get a user's KTP by ID (accessible only by admin)
  getKTPById: async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await Users.findByPk(userId, {
        attributes: ['ktp'],
      });

      if (!user) {
        return res.status(404).json({
          code: 404,
          status: 'Not Found',
          message: 'User not found',
        });
      }

      const ktpUrl = user.ktp;

      return res.status(200).json({
        code: 200,
        status: 'OK',
        message: 'KTP retrieved successfully',
        ktpUrl,
      });
    } catch (err) {
      return handleError(res, err);
    }
  },

  // Get a user's KTP by token
  getKTP: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await Users.findByPk(userId, {
        attributes: ['ktp'],
      });

      if (!user) {
        return res.status(404).json({
          code: 404,
          status: 'Not Found',
          message: 'User not found',
        });
      }

      const ktpUrl = user.ktp;

      return res.status(200).json({
        code: 200,
        status: 'OK',
        message: 'KTP retrieved successfully',
        ktpUrl,
      });
    } catch (err) {
      return handleError(res, err);
    }
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
