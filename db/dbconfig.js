// Import and configure the dotenv package to load environment variables from a .env file.
require('dotenv').config();

// Destructure the relevant environment variables for the database connection.
const {
  DB_USERNAME,
  DB_DATABASE,
  DB_PASSWORD = null, // Default to null if no password is provided in the environment variables.
  DB_HOST,
  DB_PORT,
  DB_DIALECT = 'mysql' // Default to MySQL as the dialect if not specified.
} = process.env;

// Export the configuration object for different environments (development, test, production).
module.exports = {
  "development": {
    "username": DB_USERNAME,
    "password": DB_PASSWORD,
    "database": DB_DATABASE,
    "host": DB_HOST,
    "port": DB_PORT,
    "dialect": DB_DIALECT,
    "pool": {
      "max": 5,
      "min": 0,
      "acquire": 30000,
      "idle": 10000
    },
  },
  "test": {
    "username": DB_USERNAME,
    "password": DB_PASSWORD,
    "database": DB_DATABASE,
    "host": DB_HOST,
    "port": DB_PORT,
    "dialect": DB_DIALECT,
    "pool": {
      "max": 5,
      "min": 0,
      "acquire": 30000,
      "idle": 10000
    },
  },
  "production": {
    "username": DB_USERNAME,
    "password": DB_PASSWORD,
    "database": DB_DATABASE,
    "host": DB_HOST,
    "port": DB_PORT,
    "dialect": DB_DIALECT,
    "pool": {
      "max": 5,
      "min": 0,
      "acquire": 30000,
      "idle": 10000
    },
  }
};
