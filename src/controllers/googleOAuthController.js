const passport = require('../configs/passport');
const jwt = require('jsonwebtoken');
const { Users } = require('../../db/models');
const { handleError } = require('../middlewares/errorHandler');

// Function to generate JWT token
const generateAuthToken = (user) => {
    const { firstName, lastName, email, avatar, role, isVerified } = user;
    return jwt.sign({ firstName, lastName, email, avatar, role, isVerified }, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
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
    
            console.log(isCreated);
            const token = generateAuthToken(user);
    
            return res.json({
                message: 'Login success',
                token,
            });
    
        } catch (error) {
            return handleError(res, error);
        }
    },

    // Endpoint called when Google authentication fails
    googleFailure: (req, res) => {
        console.error('Google authentication failed:', req.query.error);
        res.status(401).send('Failed to login');
    },

    // Test endpoint for authentication with Google
    testGoogleAuth: (req, res) => {
        res.send('<a href="/googleOAuth/login">Authenticate with Google here</a>');
    },
};
