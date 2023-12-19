const { ValidationError } = require("sequelize");

module.exports.handleError = (error, req, res, next) => {
  try {
    let statusCode = 500;
    let errorMessage = 'Internal Server Error';
    const additional = {};

    if (error instanceof ValidationError) {
      statusCode = 422;
      errorMessage = 'Unprocessable Entity';
      additional.validationErrors = error.errors.map(validationError => ({
        field: validationError.path,
        message: validationError.message,
      }));
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      statusCode = 409;
      errorMessage = 'Conflict';
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
      errorMessage = 'Unauthorized';
    } else if (error.name === 'NotFoundError') {
      statusCode = 404;
      errorMessage = 'Not Found';
    } else if (error.name === 'BadRequestError') {
      statusCode = 400;
      errorMessage = error.errorMessage || 'Bad Request';
    } else if (error.name === 'ForbiddenError') {
      statusCode = 403;
      errorMessage = error.errorMessage || 'Forbidden';
    } else if (error.name === 'MulterError') {
      statusCode = 400;
      errorMessage = error.message || 'Multer Error';
    } else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      errorMessage = error.message || 'Invalid Token';
    } else {
      console.error('Unhandled error:', error);
    }

    // Check if the error object has a 'status' property
    const status = error.status || statusCode;

    return res.status(status).json({
      code: status,
      message: errorMessage,
      error: error.message,
      ...additional,
    });
  } catch (err) {
    // Log and handle unexpected errors
    console.error('An unexpected error occurred in the error handler:', err);
    return res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: 'An unexpected error occurred.',
    });
  }
};
