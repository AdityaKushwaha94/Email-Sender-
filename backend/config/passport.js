const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../src/models/User');

// Validate environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️ Google OAuth credentials not found. Google authentication will be disabled.');
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Validate profile data
      if (!profile.id || !profile.emails?.[0]?.value) {
        return done(new Error('Invalid Google profile data'), null);
      }

      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        if (user.isBlacklisted) {
          return done(null, false, { message: 'Account access denied' });
        }
        return done(null, user);
      }

      // Create new user with validated data
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value.toLowerCase(),
        name: profile.displayName?.trim() || 'Google User',
        profilePhoto: profile.photos?.[0]?.value || null
      });
      
      await user.save();
      return done(null, user);
    } catch (error) {
      return done(new Error('Authentication service error'), null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error);
  }
});
