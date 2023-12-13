require(dotenv).config()
const { FE_PORT } = process.env;

const { Users } = require('../../db/models');
const userController = require('./userController');

const { sendAuthEmail, verifyAndInvalidateLastToken} = require('../utils/emailer');
const { handleError } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');
const { crudControllers } = require('../utils/crud');

const fs = require('fs');
const ejs = require('ejs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Generate JWT token
const generateAuthToken = (user) => {
  const { id, firstName, lastName, email, role } = user;
  // console.log(user);
  return jwt.sign({ id, firstName, lastName, email, role }, process.env.JWT_SECRET, {
    expiresIn: "1d", // TODO : move to config
  });
};

// EJS templates
// Send email verification
const verifyEmailTemplate = fs.readFileSync("../views/emails/verifyEmail.ejs", {
  encoding: "utf-8",
});
// Send password reset
const passwordResetTemplate = fs.readFileSync(
  "./src/views/emails/passwordReset.ejs",
  { encoding: "utf-8" }
);

// Email Logics
// Render the emails
const getVerifyEmailText = (hostUrl, token, data) => {
  return ejs.render(verifyEmailTemplate, {
    ...data,
    path: hostUrl + `/auth/verify`,
    token,
  }); // Return html with Verify link - ${hostUrl}/auth/verify/${token}
};
const getResetEmailText = (hostUrl, token, data) => {
  return ejs.render(passwordResetTemplate, {
    ...data,
    path: hostUrl + `/auth/reset`,
    token,
  }); // Return html with Password Reset link - ${hostUrl}/auth/reset/${token}
};

// Send the emails using emailer module
const sendVerifyEmail = async (req, res, userData) => {
  const { email } = req.body;
  // const hostUrl = `${req.protocol}://${req.get("host")}`;
  const hostUrl = FE_PORT;
  return await sendAuthEmail(
    req,
    res,
    "Verification",
    userData,
    email,
    hostUrl,
    getVerifyEmailText
  );
};

// Send password reset email
const sendResetEmail = async (req, res) => {
  // const hostUrl = `${req.protocol}://${req.get("host")}`;
  const hostUrl = FE_PORT;
  const { email } = req.body;
  const user = await User.findOne({
    where: { email },
    attributes: userController.attributes,
    raw: true,
  });
  if (user) {
    return await sendAuthEmail(
      req,
      res,
      "Password reset",
      user,
      email,
      hostUrl,
      getResetEmailText
    );
  }
  return handleError(res, {
    status: 404,
    message: "User not found",
  });
};

module.exports = {
  login: async (req, res, next) => {
    try {
      // Check if user exists by email
      const { email, password } = req.body;
      const user = await Users.findOne({ where: { email } });
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
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  userRegister: async (req, res) => {
    const { username, firstName, lastName, email, password } = req.body;
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
        firstName,
        lastName,
        username,
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
    const { username, firstName, lastName, email, password } = req.body;

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
        firstName,
        lastName,
        username,
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

  verifyEmail: async (req, res) => {
    const { token } = req.params;
    console.log(token);
    if (token) {
      try {
        // verify and decode the token
        const firstData = jwt.verify(token, process.env.JWT_SECRET);
        // verify the token using tokenStore
        if (!verifyAndInvalidateLatestToken(firstData.email, token))
          return res.status(400).json({ message: "Token expired" });

        // second data input
        // TODO : validation
        const secondData = {gender,address,contact} = req.body;
        
        // create the new user
        const user = await User.create({ ...firstData, ...secondData });
        // generate auth token for the new user
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
    return res.status(404).json({ message: "Token not found" });
    // return await sendVerifyEmail(req, res);
  },
};
