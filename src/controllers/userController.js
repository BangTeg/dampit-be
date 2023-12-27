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

  // // Updated uploadAvatar function with Multer middleware
  // uploadAvatar: async (req, res) => {
  //   try {
  //     // Check if a file was uploaded (Multer middleware adds 'file' to the request)
  //     if (!req.file) {
  //       return res.status(400).json({
  //         code: 400,
  //         status: 'Bad Request',
  //         message: 'No file uploaded.',
  //       });
  //     }

  //     const { id } = req.user;

  //     // Update the user's avatar path in the database
  //     const user = await Users.findByPk(id);

  //     if (!user) {
  //       return res.status(404).json({
  //         code: 404,
  //         status: 'Not Found',
  //         message: 'User not found',
  //       });
  //     }

  //     // Remove the previous avatar file if it exists
  //     if (user.avatar) {
  //       const avatarPath = path.join(__dirname, `../src/avatar/${user.avatar}`);
  //       fs.unlinkSync(avatarPath);
  //     }

  //     user.avatar = req.file.filename; // Store the new avatar filename in the 'avatar' field
  //     await user.save();

  //     return res.status(200).json({
  //       code: 200,
  //       status: 'OK',
  //       message: 'Profile picture uploaded successfully.',
  //       avatarPath: user.avatar,
  //     });
  //   } catch (err) {
  //     return handleError(res, err);
  //   }
  // },

  // // Get a user's avatar by token
  // getAvatar: async (req, res) => {
  //   try {
  //     const { id } = req.user;
  //     // Find the user by ID
  //     const user = await User.findByPk(id, { attributes: ["avatar"] });

  //     if (!user) {
  //       return res.status(404).json({
  //         code: 404,
  //         status: "Not Found",
  //         message: "User not found",
  //       });
  //     }

  //     if (!user.avatar) {
  //       return res.status(404).json({
  //         code: 404,
  //         status: "Not Found",
  //         message: "User's avatar not found",
  //       });
  //     }

  //     const avatarPath = path.join(__dirname, `../src/avatar/${user.avatar}`);

  //     // Check if the avatar file exists
  //     if (fs.existsSync(avatarPath)) {
  //       // Send the avatar file as a response
  //       res.sendFile(avatarPath);
  //     } else {
  //       return res.status(404).json({
  //         code: 404,
  //         status: "Not Found",
  //         message: "User's avatar not found",
  //       });
  //     }
  //   } catch (err) {
  //     return handleError(res, err);
  //   }
  // },

  // // Updated uploadCV function with Multer middleware
  // uploadCV: async (req, res) => {
  //   try {
  //     // Check if a file was uploaded (Multer middleware adds 'file' to the request)
  //     if (!req.file) {
  //       return res.status(400).json({
  //         code: 400,
  //         status: "Bad Request",
  //         message: "No file uploaded.",
  //       });
  //     }

  //     const { id } = req.user;

  //     // Update the user's CV field in the database with the CV link
  //     const user = await User.findByPk(id);
  //     if (!user) {
  //       return res.status(404).json({
  //         code: 404,
  //         status: "Not Found",
  //         message: "User not found",
  //       });
  //     }

  //     // Remove the previous CV file if it exists
  //     if (user.cv) {
  //       const cvPath = path.join(__dirname, `../src/cv/${user.cv}`);
  //       fs.unlinkSync(cvPath);
  //     }

  //     // // Store the new CV link in the 'cv' field
  //     // user.cv = `https://${BE_PORT}/src/cv/${req.file.filename}`;
  //     user.cv = req.file.filename; // Store the new CV filename in the 'cv' field

  //     await user.save();

  //     return res.status(200).json({
  //       code: 200,
  //       status: "OK",
  //       message: "CV uploaded successfully.",
  //       cvPath: user.cv, 
  //       cvLink: `https://${BE_PORT}/src/cv/${user.cv}`,
  //     });
  //   } catch (err) {
  //     return handleError(res, err);
  //   }
  // },

  // // Get a user's CV by token
  // getCV: async (req, res) => {
  //   try {
  //     const { id } = req.user;
  //     // Find the user by ID
  //     const user = await User.findByPk(id, { attributes: ["id", "name", "cv"] });

  //     if (!user) {
  //       return res.status(404).json({
  //         code: 404,
  //         status: "Not Found",
  //         message: "User not found",
  //       });
  //     }

  //     if (!user.cv) {
  //       return res.status(404).json({
  //         code: 404,
  //         status: "Not Found",
  //         message: "User's CV not found",
  //       });
  //     }

  //     const cvPath = path.join(__dirname, `../src/cv/${user.cv}`);

  //     // Check if the CV file exists
  //     if (fs.existsSync(cvPath)) {
  //       // Return the specified response format
  //       return res.status(200).json({
  //         id: user.id,
  //         name: user.name,
  //         cv: `https://${BE_PORT}/src/cv/${user.cv}`,
  //       });
  //     } else {
  //       return res.status(404).json({
  //         code: 404,
  //         status: "Not Found",
  //         message: "User's CV not found",
  //       });
  //     }
  //   } catch (err) {
  //     return handleError(res, err);
  //   }
  // },

  // // Admin get a user's CV by ID
  // getCVById: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     // Find the user by ID
  //     const user = await User.findByPk(id, { attributes: ["id", "name", "cv"] });

  //     if (!user) {
  //       return res.status(404).json({
  //         code: 404,
  //         status: "Not Found",
  //         message: "User not found",
  //       });
  //     }

  //     if (!user.cv) {
  //       return res.status(404).json({
  //         code: 404,
  //         status: "Not Found",
  //         message: "User's CV not found",
  //       });
  //     }

  //     const cvPath = path.join(__dirname, `../src/cv/${user.cv}`);

  //     // Check if the CV file exists
  //     if (fs.existsSync(cvPath)) {
  //       // Return the specified response format
  //       return res.status(200).json({
  //         id: user.id,
  //         name: user.name,
  //         cv: `https://${BE_PORT}/src/cv/${user.cv}`,
  //       });
  //     } else {
  //       return res.status(404).json({
  //         code: 404,
  //         status: "Not Found",
  //         message: "User's CV not found",
  //       });
  //     }
  //   } catch (err) {
  //     return handleError(res, err);
  //   }
  // },

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
