require('dotenv').config();

const { JWT_SECRET, JWT_EXPIRY, FE_HOST } = process.env;
const passport = require('../configs/passport');
const jwt = require('jsonwebtoken');
const { Users } = require('../../db/models');
const { handleError } = require('../middlewares/errorHandler');

// Function to generate JWT token
const generateAuthToken = (user) => {
    const { id, firstName, lastName, email, role } = user;
    return jwt.sign({ id, firstName, lastName, email, role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
    });
};

// Function to generate a unique username
const generateUniqueUsername = async (firstName, lastName) => {
    let username = `Dampit User ${firstName}${lastName.charAt(0)}`;
    let isUnique = false;
    let counter = 1;

    while (!isUnique) {
        const existingUser = await Users.findOne({ where: { username } });
        if (!existingUser) {
            isUnique = true;
        } else {
            counter++;
            username = `Dampit User ${firstName}${lastName.charAt(0)} ${counter}`;
        }
    }

    return username;
};

module.exports = {
    // Endpoint google login
    googleLogin: passport.authenticate('google', {
        scope: ['profile', 'email'],
        successRedirect: '/googleOAuth/protected',
        failureRedirect: '/googleOAuth/failure'
    }),

    // Endpoint called after successful Google authentication
    googleProtected: async (req, res) => {
        try {
            console.log(req.user);  // Log the entire req.user object to inspect its structure
    
            // Extract user information from the profile
            const firstName = req.user.name.givenName;
            const lastName = req.user.name.familyName;
            const email = req.user.emails[0].value;
            const avatar = req.user.photos[0].value;
    
            // Find or create the user based on Google profile information
            const [user, isCreated] = await Users.findOrCreate({
                where: { email },
                defaults: { firstName, lastName, email, avatar, role: 'user', isVerified: 'yes' },
            });

            // Generate a unique username if the user doesn't have one
            if (!user.username) {
                const username = await generateUniqueUsername(firstName, lastName);
                user.username = username;
                await user.save();
            }
    
            console.log(isCreated);
            const token = generateAuthToken(user);

            return res.redirect(`${FE_HOST}/auth/signin/oauth?token=${token}`);

    
        } catch (error) {
            return handleError(res, error);
        }
    },

    // Endpoint called when Google authentication fails
    googleFailure: (req, res) => {
        console.error('Google authentication failed:', req.query.error);
        return handleError(res, {
            status: 400,
            message: 'Google authentication failed',
        });
    },

    // Test endpoint for authentication with Google
    testGoogleAuth: (req, res) => {
        res.send('<a href="/googleOAuth/login">Authenticate with Google here</a>');
    },
};
