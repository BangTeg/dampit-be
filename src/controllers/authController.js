require('dotenv').config()

const { FE_PORT } = process.env;

const { Users } = require('../../db/models');
const userController = require('./userController');

const { sendAuthEmail, verifyAndInvalidateLastToken } = require('../utils/emailer');
const { handleError } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');
const { crudControllers } = require('../utils/crud');

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
// const logger = require('../utils/logger');

// Generate JWT token
const generateAuthToken = (user) => {
  const { id, firstName, lastName, email, role } = user;
  return jwt.sign({ id, firstName, lastName, email, role }, process.env.JWT_SECRET, {
    expiresIn: 86400000, // TODO: move to config
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
    token,
  });
};

// Send the emails using emailer module
const sendVerifyEmail = async (req, res, email, firstName) => {
  // const { email, firstName } = req.body;
  // const hostUrl = FE_PORT;
  const hostUrl = `${req.protocol}://${req.get("host")}`;
  return await sendAuthEmail(
    req,
    res,
    "Verification",
    email,
    firstName,
    hostUrl,
    getVerifyEmailText
  );
};

// Send password reset email
const sendResetEmail = async (req, res, email, firstName) => {
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
      getResetEmailText
    );
  }
  const error = {
    status: 404,
    message: "User not found",
  };
  return handleError(error, req, res);
};

module.exports = {
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

      // Check if password matches
      const isMatch = await bcrypt.compare(password, user.password);

      // Debugging
      console.log(`password ${password}, dbpassword ${user.password}`);

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
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        avatar: user.avatar,
        address: user.address,
        contact: user.contact,
        ktp: user.ktp,
        role: user.role
      });
    } catch (error) {
      // logger.error(error);
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

      const data = await Users.create({
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        role: 'user',
      });

      // Send email verification
      return await sendVerifyEmail(req, res, email, firstName, data);
    } catch (error) {
      // logger.error(error);
      return handleError(error, req, res);
    }
  },

  adminRegister: async (req, res) => {
    const { username, firstName, lastName, email, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = {
        status: 422,
        message: errors.array(),
      };
      return handleError(error, req, res);
    }

    try {
      const user = await Users.findOne({ where: { email } });
      if (user) {
        const error = {
          status: 409,
          message: 'Email already exists',
        };
        return handleError(error, req, res);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const data = await Users.create({
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        role: 'admin',
      });

      // Send email verification
      return await sendVerifyEmail(req, res, data);
    } catch (error) {
      // logger.error(error);
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
        return await crudControllers.update(
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
  
  verifyEmail: async (req, res) => {
    const { token } = req.params;
    console.log(token);
  
    if (token) {
      try {
        // Verify and decode the token
        const firstData = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", firstData);
  
        // Verify the token using tokenStore
        if (!verifyAndInvalidateLastToken(firstData.email, token))
          return res.status(400).json({ message: "Token expired" });
  
        // Second data input
        // TODO: validation
        const secondData = { gender, address, contact } = req.body;
  
        // Create the new user
        const user = await Users.create({ ...firstData, ...secondData });
        // Generate auth token for the new user
        const authToken = generateAuthToken(user);
        return res.json({
          message: "Email Registered and Verified Successfully",
          token: authToken,
          name: user.name,
        });
      } catch (error) {
        return handleError(res, error);
      }
    }
  },
};
