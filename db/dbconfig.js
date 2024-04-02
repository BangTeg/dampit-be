require('dotenv').config();

const {
  DEVDB_USERNAME,
  DEVDB_DATABASE,
  DEVDB_PASSWORD,
  DEVDB_HOST,
  DEVDB_PORT,
  DB_USERNAME,
  DB_DATABASE,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_SOCKET,
  DB_DIALECT = 'mysql' // Default to MySQL as the dialect
} = process.env;

// Export the configuration object for different environments (development, test, production).
module.exports = {
  "development": {
    "username": DEVDB_USERNAME,
    "password": DEVDB_PASSWORD,
    "database": DEVDB_DATABASE,
    "host": DEVDB_HOST,
    "port": DEVDB_PORT,
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
    "socketPath": `/cloudsql/${DB_SOCKET}`,
  },
  "production": {
    "username": DB_USERNAME,
    "password": DB_PASSWORD,
    "database": DB_DATABASE,
    "host": DB_HOST,
    "port": DB_PORT,
    "dialect": DB_DIALECT,
    "socketPath": `/cloudsql/${DB_SOCKET}`,
  }
};
