const { ValidationError } = require('express-validator');

module.exports.handleError = (error, req, res, next) => {
    // Log the error for debugging purposes
    console.error(error);

    // Default status code and error message
    let statusCode = 500;
    let errorMessage = 'Internal Server Error';

    // Handle specific error types
    if (error instanceof ValidationError) {
        statusCode = 422; // Unprocessable Entity
        errorMessage = error.array().map((validationError) => ({ [validationError.param]: validationError.msg }));
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

    // Send the error response to the client
    return res.status(statusCode).json({
        code: statusCode,
        message: errorMessage
    });
};
