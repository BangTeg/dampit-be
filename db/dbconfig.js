// Import and configure the dotenv package to load environment variables from a .env file.
require('dotenv').config();

// Destructure the relevant environment variables for the database connection.
const {
  DEVDB_USERNAME,
  DEVDB_DATABASE,
  DEVDB_PASSWORD = null,
  DEVDB_HOST,
  DEVDB_PORT,
  DB_USERNAME,
  DB_DATABASE,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_INSTANCE,
  DB_DIALECT = 'mysql' // Default to MySQL as the dialect
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
    "timezone": "+07:00", // Set timezone to Jakarta time.
  },
  "test": {
    "username": DB_USERNAME,
    "password": DB_PASSWORD,
    "database": DB_DATABASE,
    "host": DB_HOST,
    "port": DB_PORT,
    "dialect": DB_DIALECT,
    "timezone": "+07:00", // Set timezone to Jakarta time.
  },
  "production": {
    "username": DB_USERNAME,
    "password": DB_PASSWORD,
    "database": DB_DATABASE,
    "host": DB_HOST,
    "port": DB_PORT,
    "dialect": DB_DIALECT,
    "timezone": "+07:00", // Set timezone to Jakarta time.
  }
};
