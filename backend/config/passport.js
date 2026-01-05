const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../src/models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      
      
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        if (user.isBlacklisted) {
          
          return done(null, false, { message: 'User is blacklisted' });
        }
        return done(null, user);
      }

      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        profilePhoto: profile.photos[0]?.value
      });
      
      await user.save();
      console.log('Google OAuth: New user created successfully:', user.email);
      return done(null, user);
    } catch (error) {
      console.error('Google OAuth Strategy Error:', error);
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log('Deserializing user with ID:', id);
    const user = await User.findById(id);
    if (!user) {
      console.log('User not found during deserialization:', id);
      return done(null, false);
    }
    console.log('User deserialized successfully:', user.email);
    done(null, user);
  } catch (error) {
    console.error('Deserialization error:', error);
    done(error);
  }
});
