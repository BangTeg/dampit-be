require('dotenv').config();

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const config = require("../configs/emailConfig");

const {
  expiresIn,
  resendCooldown,
  cleanInterval,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  SMTP_SECURE,
  mailOptions,
} = config;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT == 465 ? true : SMTP_SECURE ?? false,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
});

// CONVENTIONS
// AUTH EMAIL = password reset and email verification

// Email Logics

// send an email (sendMail wrapped in promise)
const sendEmail = (mailOptions) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("Error sending email:", error);
        reject(error); // Reject the promise with the error
      } else {
        console.log("Email sent:", info.response);
        resolve(true); // Resolve the promise with a value (true in this case)
      }
    });
  });
};

// Send an Auth email
const sendAuthEmail = async (req, res, title, email, firstName, hostUrl, getText) => {
  try {
    const token = jwt.sign({ email }, process.env.JWT_SECRET);
    console.log("Generated Token:", token);

    const emailerResult = await sendEmail({
      ...mailOptions,
      subject: mailOptions.subjectPrefix + title,
      to: email,
      html: getText(hostUrl, token, firstName),
    });

    if (emailerResult.success) {
      tokenStore[email] = token;
      console.log("Updated tokenStore:", tokenStore);
      return { success: true, message: emailerResult.message };
    } else {
      return { success: false, message: emailerResult.message };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: 'Internal Server Error' };
  }
};

// Verification Token Logics

// Temporarily stores all sent jwt token and its email and cool down
const tokenStore = {};

// Verify token in tokenStore
const verifyAndInvalidateLastToken = (email, token) => {
  console.log("token", token);
    try {
      // Verify the token (check if the token is still valid)
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token Payload:", verified);

      // Remove the token from the tokenStore
      delete tokenStore[email];
      console.log("Token invalidated successfully");
      
      return true;
    } catch (err) {
      console.error("Error deleting token :", err);
    }
};

// Remove expired tokens from tokenStore (called every set interval)
const cleanExpired = () => {
  let count = 0;
  for (const [email, token] of Object.entries(tokenStore)) {
    try {
      // verify the token (check if the token is still valid)
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token Payload:", verified);
    } catch (err) {
      try {
        delete tokenStore[email];
        count += 1;
      } catch (delErr) {
        console.error(delErr);
      }
    }
  }
  console.log(`${count} token(s) is invalid and removed from email TokenStore`);
  setTimeout(cleanExpired, cleanInterval);
};

cleanExpired(); // start cleanExpired interval loop

// Module Exports
module.exports = {
  sendEmail,
  sendAuthEmail,
  verifyAndInvalidateLastToken,
};