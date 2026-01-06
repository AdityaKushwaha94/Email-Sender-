const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    sparse: true,
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [100, 'Email cannot exceed 100 characters'],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    match: [/^[a-zA-Z0-9\s.-]+$/, 'Name can only contain letters, numbers, spaces, periods, and hyphens']
  },
  password: {
    type: String,
    select: false,
    minlength: [6, 'Password must be at least 6 characters'],
    maxlength: [128, 'Password cannot exceed 128 characters']
  },
  profilePhoto: {
    type: String,
    trim: true,
    maxlength: [500, 'Profile photo URL too long']
  },
  isBlacklisted: {
    type: Boolean,
    default: false,
    index: true
  },
  emailCredentials: {
    senderEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [100, 'Sender email too long']
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date
    }
  },
  emailVerification: {
    otp: {
      type: String,
      select: false
    },
    otpExpiry: {
      type: Date,
      select: false
    },
    verificationAttempts: {
      type: Number,
      default: 0
    },
    lastVerificationAttempt: {
      type: Date
    }
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      delete ret.__v;
      return ret;
    }
  }
});

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified and exists
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(12); // Increased salt rounds for better security
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Account locking methods
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have hit max attempts and it's not locked, lock account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // Lock for 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Email verification methods
userSchema.methods.setEmailVerificationOTP = function(otp, expiry) {
  this.emailVerification.otp = otp;
  this.emailVerification.otpExpiry = expiry;
  this.emailVerification.lastVerificationAttempt = new Date();
  return this.save();
};

userSchema.methods.verifyEmailOTP = function(providedOTP) {
  if (!this.emailVerification.otp || !this.emailVerification.otpExpiry) {
    return false;
  }
  
  // Check if OTP is expired
  if (new Date() > this.emailVerification.otpExpiry) {
    return false;
  }
  
  // Check if OTP matches
  return this.emailVerification.otp === providedOTP.toString();
};

userSchema.methods.markEmailAsVerified = function() {
  this.emailCredentials.isVerified = true;
  this.emailCredentials.verifiedAt = new Date();
  this.emailVerification.otp = undefined;
  this.emailVerification.otpExpiry = undefined;
  this.emailVerification.verificationAttempts = 0;
  return this.save();
};

userSchema.methods.incrementVerificationAttempts = function() {
  this.emailVerification.verificationAttempts += 1;
  this.emailVerification.lastVerificationAttempt = new Date();
  return this.save();
};

userSchema.methods.canAttemptVerification = function() {
  const maxAttempts = 5;
  const lockoutDuration = 15 * 60 * 1000; // 15 minutes
  
  if (this.emailVerification.verificationAttempts >= maxAttempts) {
    if (!this.emailVerification.lastVerificationAttempt) return false;
    
    const timeSinceLastAttempt = Date.now() - this.emailVerification.lastVerificationAttempt.getTime();
    if (timeSinceLastAttempt < lockoutDuration) {
      return false;
    }
    
    // Reset attempts after lockout period
    this.emailVerification.verificationAttempts = 0;
  }
  
  return true;
};

module.exports = mongoose.model('User', userSchema);
