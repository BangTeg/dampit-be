require('dotenv').config();

const { handleError } = require('./src/middleware/errorHandler');
const express = require('express');
const app = express();
const port = process.env.PORT;
const cors = require('cors');
const route = require('./src/routes');
const session = require('express-session');
const passport = require('passport');

// Catch body from request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'secret'
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use("/", route);

// Error handling - place it after defining your routes
app.use(handleError);

// Welcome page
app.get('/', (req, res) => {
  res.send('Dampit Trans Solo, Rental Mobil Paling Terpercaya di Kota Solo');
});

// Listen to port
app.listen(port, () => {
  console.log(`Dampit listening on port ${port}`);
});
