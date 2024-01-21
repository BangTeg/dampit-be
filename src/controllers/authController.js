require('dotenv').config()

const { FE_PORT, JWT_SECRET } = process.env;

const { Users } = require('../../db/models');
const userController = require('./userController');

const { sendAuthEmail, verifyAndInvalidateLastToken } = require('../utils/nodemailer');
const { handleError } = require('../middlewares/errorHandler');
const { validationResult } = require('express-validator');
const { crudController } = require('../utils/crud');

const fs = require('fs');

const ejs = require('ejs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Generate JWT token
const generateAuthToken = (user) => {
  const { id, firstName, lastName, email, role } = user;
  return jwt.sign({ id, firstName, lastName, email, role }, JWT_SECRET, {
    expiresIn: 86400000,
  });
};

// EJS templates
// Send email verification
const verifyEmailTemplate = fs.readFileSync("src/views/emails/verifyEmail.ejs", {
  encoding: "utf-8"
});

// Send password reset
const passwordResetTemplate = fs.readFileSync("src/views/emails/passwordReset.ejs", {
  encoding: "utf-8"
});

// Email Logics
// Render the emails
const getVerifyEmailText = (hostUrl, token, firstName) => {
  return ejs.render(verifyEmailTemplate, {
    firstName,
    path: hostUrl + `/auth/verify`,
    token,
  });
};

const getResetEmailText = (hostUrl, token, firstName) => {
  return ejs.render(passwordResetTemplate, {
    firstName,
    path: hostUrl + `/auth/reset`,
    token
  });
};

// Send the emails using nodemailer
const sendVerifyEmail = async (req, res, email, firstName, token) => {
  const hostUrl = `${req.protocol}://${req.get("host")}`;
  try {
    await sendAuthEmail(req, res, "Verification", email, firstName, hostUrl, getVerifyEmailText, token);
    return res.status(200).json({ success: true, message: 'Email verification sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Send password reset email
const sendResetEmail = async (req, res, email, firstName, token) => {
  // const hostUrl = FE_PORT;
  // const { email } = req.body;
  const hostUrl = `${req.protocol}://${req.get("host")}`;
  const user = await Users.findOne({
    where: { email },
    attributes: userController.attributes,
    raw: true,
  });
  if (user) {
    return await sendAuthEmail(
      req,
      res,
      "Password reset",
      email,
      firstName,
      hostUrl,
      getResetEmailText,
      token
    );
  }
  const error = {
    status: 404,
    message: "User not found",
  };
  return handleError(error, req, res);
};

module.exports = {
  // login: async (req, res, next) => {
  login: async (req, res, next) => {
    try {
      // Check if user exists by email
      const { email, password } = req.body;
      const user = await Users.findOne({ where: { email } });

      if (!user) {
        const error = {
          status: 401,
          message: 'User not found',
        };
        return handleError(error, req, res);
      }

      // Check if the user is verified
      if (user.isVerified === 'no') {
        const error = {
          status: 403,
          message: 'Email not verified. Please verify your email before logging in.',
        };
        return handleError(error, req, res);
      }

      // Check if password matches
      const isMatch = await bcrypt.compare(password, user.password);

      // If password doesn't match
      if (!isMatch) {
        const error = {
          status: 401,
          message: 'Wrong password, try again',
        };
        return handleError(error, req, res);
      }

      const token = generateAuthToken(user);
      return res.status(200).json({
        message: 'Login success',
        token,
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        avatar: user.avatar,
        address: user.address,
        contact: user.contact,
        ktp: user.ktp,
        role: user.role,
        isVerified: user.isVerified,
      });
    } catch (error) {
      return handleError(error, req, res);
    }
  },

  userRegister: async (req, res) => {
    try {
      const { username, firstName, lastName, email, password } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error = {
          status: 422,
          message: errors.array(),
        };
        return handleError(error, req, res);
      }

      // Validate firstName and lastName
      const nameRegex = /^[a-zA-Z]+$/;
      if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
        const error = {
          status: 422,
          message: 'Please enter a valid name without numbers or special characters',
        };
        return handleError(error, req, res);
      }

      // Check if user exists by email
      const userExist = await Users.findOne({ where: { email } });
      if (userExist) {
        const error = {
          status: 409,
          message: 'Email already exists',
        };
        return handleError(error, req, res);
      }

      // Check if user exists by username
      const usernameExist = await Users.findOne({ where: { username } });
      if (usernameExist) {
        const error = {
          status: 409,
          message: 'Username already exists',
        };
        return handleError(error, req, res);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate UUID for the user
      const userId = uuidv4();

      const data = await Users.create({
        id: userId,
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        role: 'user',
        isVerified: 'no',
      });

      // Send email verification
      return await sendVerifyEmail(req, res, email, firstName);
    } catch (error) {
      return handleError(error, req, res);
    }
  },

  adminRegister: async (req, res) => {
    try {
      const { username, firstName, lastName, email, password } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error = {
          status: 422,
          message: errors.array(),
        };
        return handleError(error, req, res);
      }

      // Validate firstName and lastName
      const nameRegex = /^[a-zA-Z]+$/;
      if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
        const error = {
          status: 422,
          message: 'Please enter a valid name without numbers or special characters',
        };
        return handleError(error, req, res);
      }

      // Check if user exists by email
      const userExist = await Users.findOne({ where: { email } });
      if (userExist) {
        const error = {
          status: 409,
          message: 'Email already exists',
        };
        return handleError(error, req, res);
      }

      // Check if user exists by username
      const usernameExist = await Users.findOne({ where: { username } });
      if (usernameExist) {
        const error = {
          status: 409,
          message: 'Username already exists',
        };
        return handleError(error, req, res);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate UUID for the user
      const userId = uuidv4();

      const data = await Users.create({
        id: userId,
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        role: 'admin',
        isVerified: 'no',
      });

      // Send email verification
      return await sendVerifyEmail(req, res, email, firstName);
    } catch (error) {
      return handleError(error, req, res);
    }
  },

  logout: async (req, res) => {
    req.logout();
    return res.status(200).json({ message: 'Logout success' });
  },

  resetPassword: async (req, res) => {
    const { token } = req.params;
    console.log(token);
  
    if (token) {
      try {
        // Verify and decode token
        const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
        const { id, email } = decodedToken;
  
        // Verify token using token store
        if (!verifyAndInvalidateLastToken(email, token)) {
          const error = {
            status: 401,
            message: 'Token expired',
          };
          return handleError(error, req, res);
        }
  
        const { password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
  
        // Update password
        return await crudController.update(
          Users,
          { attributes: userController.attributes },
          Number(id),
          { password: hashedPassword }
        )(req, res);
      } catch (error) {
        // logger.error(error);
        return handleError(error, req, res);
      }
    }
  },

  verifyEmail : async (req, res) => {
    try {
      const { token } = req.params;
  
      // Verify and decode token
      const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
      
      // Ensure the decoded token is an object with an email property
      if (!decodedToken || !decodedToken.email) {
        const error = {
          status: 400,
          message: 'Invalid token format',
        };
        return handleError(error, req, res);
      }
  
      const email = decodedToken.email;
  
      // Check if the user is already verified
      const user = await Users.findOne({ where: { email } });
      if (!user) {
        const error = {
          status: 404,
          message: 'User not found',
        };
        return handleError(error, req, res);
      }
  
      if (user.isVerified === 'yes') {
        const error = {
          status: 400,
          message: 'User is already verified',
        };
        return handleError(error, req, res);
      }
  
      // Update user's isVerified status in the database
      await Users.update({ isVerified: 'yes' }, { where: { email } });
  
      return res.status(200).json({ message: 'Email verification successful' });
    } catch (error) {
      return handleError(error, req, res);
    }
  }
  
};