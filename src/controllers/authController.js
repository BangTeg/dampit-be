require(dotenv).config()
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { User } = require('../../db/models');

const { Op } = require('sequelize');
const { verifyToken } = require('../middleware/authentication');
const { sendEmail } = require('../utils/sendEmail');
const { googleOAuth } = require('../config/googleOAuth');
const { crudControllers } = require('../utils/crud');

const {
  sendAuthEmail,
  verifyAndInvalidateLastToken,
} = require('../utils/emailer');

module.exports = {
  login: async (req, res) => {
    try {
      // Check if user exists by email
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if password matches
      const isMatch = await bcrypt.compare(password, user.password);

      // Debugging
      console.log(`password ${password}, dbpassword ${user.password}`);
      
      // If password doesn't match
      if (!isMatch) {
        return res.status(401).json({ message: 'Wrong password, try again' });
      }

      const token = generateAuthToken(user);
      return res.status(200).json({
        message: 'Login success',
        token,
        username: user.username,
        email: user.email,
        gender: user.gender,
        avatar: user.avatar,
        address: user.address,
        contact: user.contact,
        ktp: user.ktp,
        role: user.role
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  userRegister: async (req, res) => {
    const { name, email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: errors.array() });
    }
    try {
      const userExist = await User.findOne({ where: { email } });
      if (userExist) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'user',
      });

      // Send email verification
      return await sendVerifyEmail(req, res, newUser);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  adminRegister: async (req, res) => {
    const { name, email, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: errors.array() });
    }

    try {
      const user = await User.findOne({ where: { email } });
      if (user) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newAdmin = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'admin',
      });

      // Send email verification
      return await sendVerifyEmail(req, res, newAdmin);
    } catch (err) {
      return res.status(500).json({ message: err.message });
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
        const { id, email } = await jwt.verify(
          token,
          process.env.JWT_SECRET
        );

        // Verify token using token store
        if (!verifyAndInvalidateLastToken(email, token)) {
          return res.status(401).json({ message: 'Token expired' });
        }

        const { password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password
        return await crudControllers.update(
          User,
          { attributes: userController.attributes },
          Number(id),
          { password: hashedPassword }
        )(req, res);
      } catch (err) {
        return res.status(500).json({ message: err.message });
      }
    }
  },
};
