const jwt = require('jsonwebtoken');

const handleInvalidToken = (res) => {
  return res.status(401).json({ message: "Access Denied - Invalid Token" });
};

module.exports = {
  verifiedToken: async (req, res, next) => {
    // Check if the request contains an Authorization header
    const token = req.header("Authorization");

    if (!token || !token.startsWith("Bearer ")) {
      return handleInvalidToken(res);
    }

    // Extract the token value without 'Bearer ' prefix
    const tokenValue = token.slice(7);

    try {
      const verified = jwt.verify(tokenValue, process.env.JWT_SECRET);

      // Log the token payload
      console.log("Token Payload:", verified);

      // Assign the verified user to req.user for further use in routes
      req.user = verified;

      next();
    } catch (err) {
      // Pass the error to the errorHandler middleware
      return next(err);
    }
  },  
  adminToken: async (req, res, next) => {
    // Ensure req.user is defined (verifiedToken middleware should be executed first)
    if (!req.user || req.user.role !== "admin") {
      // Pass the error to the errorHandler middleware
      return next({ name: 'ForbiddenError', errorMessage: "Access Denied - You don't have permission" });
    }
    next();
  }
};