require('dotenv').config()

const { JWT_SECRET } = process.env;

const { Users } = require('../../db/models');
const userController = require('./userController');

const { sendAuthEmail } = require('../utils/nodemailer');
const { handleError } = require('../middlewares/errorHandler');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const fs = require('fs');
const ejs = require('ejs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Generate JWT token
const generateAuthToken = (user) => {
  const { id, firstName, lastName, email, role } = user;
  return jwt.sign({ id, firstName, lastName, email, role }, JWT_SECRET, {
    expiresIn: 86400000, // TODO: move to config
  });
};

// EJS templates
// Send email verification
const verifyEmailTemplate = fs.readFileSync("src/views/emails/emailNotification/verifyEmailNotification.ejs", {
  encoding: "utf-8"
});

// Send password reset
const passwordResetTemplate = fs.readFileSync("src/views/emails/emailNotification/passwordResetNotification.ejs", {
  encoding: "utf-8"
});

// Email Logics
// Render the emails
const getVerifyEmailText = (hostUrl, token, firstName) => {
  return ejs.render(verifyEmailTemplate, {
    firstName,
    path: hostUrl + `/auth/verification`,
    token,
  });
};

const getResetEmailText = (hostUrl, token, firstName) => {
  return ejs.render(passwordResetTemplate, {
    firstName,
    path: hostUrl + `/auth/reset-password`,
    token
  });
};

// Send the emails using nodemailer
const sendVerifyEmail = async (req, res, email, firstName, token) => {
  const hostUrl = `${req.protocol}://${req.get("host")}`;
  try {
    await sendAuthEmail(req, res, "Verification", email, firstName, hostUrl, getVerifyEmailText, token);
    return res.status(200).json({
      success: true,
      message: 'Email verification sent successfully'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Send password reset email
const sendResetEmail = async (req, res, email, firstName, token) => {
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
  return handleError(res, error);
};

module.exports = {
  login: async (req, res) => {
    try {
      // Check if user exists by email
      const { email, password } = req.body;
      const user = await Users.findOne({ where: { email } });

      // If user doesn't exist by email or username
      if (!user) {
        return handleError(res, {
          status: 401,
          message: 'Email not found',
        });
      }

      // Check if the user is verified
      if (user.isVerified === 'no') {
        return handleError(res, {
          status: 401,
          message: 'Email is not verified',
        });
      }

      // Check if password matches
      const isMatch = await bcrypt.compare(password, user.password);

      // If password doesn't match
      if (!isMatch) {
        return handleError(res, {
          status: 401,
          message: 'Password incorrect',
        });
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
      return handleError(res, error);
    }
  },

  userRegister: async (req, res) => {
    try {
      const { username, firstName, lastName, email, password } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return handleError (res, {
          status: 422,
          message: errors.array(),
        });
      }

      // Prevent user from registering firstName and lastName with numbers or special characters
      if (firstName.match(/[^a-zA-Z\s']/g) || lastName.match(/[^a-zA-Z\s']/g)) {
        return handleError (res, {
          status: 422,
          message: 'First name and last name must not contain numbers or special characters',
        });
      }

      // Check if user exists by email
      const userExist = await Users.findOne({ where: { email } });
      if (userExist) {
        return handleError (res, {
          status: 409,
          message: 'Email already exists',
        });
      }

      // Check if user exists by username
      const usernameExist = await Users.findOne({ where: { username } });
      if (usernameExist) {
        return handleError (res, {
          status: 409,
          message: 'Username already exists',
        });
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
      return handleError(res, error);
    }
  },

  adminRegister: async (req, res) => {
    try {
      const { username, firstName, lastName, email, password } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return handleError (res, {
          status: 422,
          message: errors.array(),
        });
      }

      // Prevent user from registering firstName and lastName with numbers or special characters
      if (firstName.match(/[^a-zA-Z\s']/g) || lastName.match(/[^a-zA-Z\s']/g)) {
        return handleError (res, {
          status: 422,
          message: 'First name and last name must not contain numbers or special characters',
        });
      }

      // Check if user exists by email
      const userExist = await Users.findOne({ where: { email } });
      if (userExist) {
        return handleError (res, {
          status: 409,
          message: 'Email already exists',
        });
      }

      // Check if user exists by username
      const usernameExist = await Users.findOne({ where: { username } });
      if (usernameExist) {
        return handleError (res, {
          status: 409,
          message: 'Username already exists',
        });
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
      return handleError(res, error);
    }
  },

  logout: async (req, res) => {
    if (req.isAuthenticated()) {
      req.logout();
      return res.status(200).json({ message: 'Logout success' });
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  },

  initiateResetPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // Check if user exists by email
      const user = await Users.findOne({ where: { email } });

      if (!user) {
        return handleError(res, {
          status: 404,
          message: 'User not found',
        });
      }

      // Generate reset token with user's email encoded
      const resetToken = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '15m' });

      // Send password reset email
      await sendResetEmail(req, res, email, user.firstName, resetToken);

      return res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      return handleError(res, error);
    }
  },  

  verifyResetPasswordEmail: async (req, res) => {
    try {
      const { token } = req.params;
      console.log('Token to verify:', token);

      // Verify and decode token
      const decodedToken = await jwt.verify(token, JWT_SECRET);

      // Ensure the decoded token is an object with an email property
      if (!decodedToken || !decodedToken.email) {
        return handleError(res, {
          status: 401,
          message: 'Invalid token',
        });
      }

      // Extract email from the decoded token
      const email = decodedToken.email;

      // Find user with the provided email
      const user = await Users.findOne({ where: { email } });

      // If user doesn't exist
      if (!user) {
        return handleError(res, {
          status: 401,
          message: 'User not found',
        });
      }

      // Check if newPassword is provided in the request body
      const { newPassword } = req.body;
      if (!newPassword) {
        return handleError(res, {
          status: 400,
          message: 'New password is required',
        });
      }

      // Reset the user's password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update the user's password
      await Users.update(
        { password: hashedPassword },
        { where: { id: user.id } }
      );

      return res.status(200).json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      return handleError(res, error);
    }
  },

  verifyRegisterEmail : async (req, res) => {
    try {
      const { token } = req.params;
  
      // Verify and decode token
      const decodedToken = await jwt.verify(token, JWT_SECRET);
      
      // Ensure the decoded token is an object with an email property
      if (!decodedToken || !decodedToken.email) {
        return handleError(res, {
          status: 401,
          message: 'Invalid token',
        });
      }
  
      const email = decodedToken.email;
  
      // Check if the user is already verified
      const user = await Users.findOne({ where: { email } });
      if (!user) {
        return handleError(res, {
          status: 404,
          message: 'User not found',
        });
      }
  
      if (user.isVerified === 'yes') {
        const error = {
          status: 400,
          message: 'User is already verified',
        };
        return handleError(res, error);
      }
  
      // Update user's isVerified status in the database
      await Users.update({ isVerified: 'yes' }, { where: { email } });
  
      return res.status(200).json({ message: 'Email verification successful' });
    } catch (error) {
      return handleError(res, error);
    }
  }
};