require('dotenv').config();

// const { handleError } = require('./src/middleware/errorHandler');
const express = require('express');
const app = express();
const port = process.env.PORT;
// const port = process.env.DEV_PORT;
const cors = require('cors');
const route = require('./src/routes');
const session = require('express-session');
const passport = require('passport');

// // Logger middleware
// const morgan = require('morgan');
// const logger = require('./src/utils/logger');

// Catch body from request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET || 'defaultSecret'
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
  // origin: ['http://yourfrontenddomain.com', 'https://anotherfrontenddomain.com']
  origin: '*',
  credentials: true
}));

app.use("/", route);

// // Use morgan for request logging
// app.use(morgan('combined', { stream: logger.stream }));

// Welcome page
app.get('/', (req, res) => {
  res.send('Dampit Trans Solo, Rental Mobil Paling Terpercaya di Kota Solo');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(`Internal Server Error: ${err.message}`);
});

// Listen to port
app.listen(port, () => {
  console.log(`Dampit listening on port ${port}`);
});


// --- Not yet implemented ---
// // Error handling - place it after defining your routes
// app.use(handleError);

// // Handle uncaught exceptions
// process.on('uncaughtException', (err) => {
//   logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
//   process.exit(1); // Exit the process to prevent undefined behavior
// });
