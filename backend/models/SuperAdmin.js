const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const superAdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin'],
    default: 'superadmin'
  },
  permissions: {
    userManagement: {
      type: Boolean,
      default: true
    },
    systemSettings: {
      type: Boolean,
      default: true
    },
    dataAccess: {
      type: Boolean,
      default: true
    },
    aiManagement: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better performance
superAdminSchema.index({ email: 1 });
superAdminSchema.index({ username: 1 });
superAdminSchema.index({ isActive: 1 });

// Virtual for account lock status
superAdminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
superAdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
superAdminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Increment login attempts
superAdminSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
superAdminSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Update last login
superAdminSchema.methods.updateLastLogin = function() {
  return this.updateOne({
    $set: { lastLogin: new Date() },
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to create default superadmin
superAdminSchema.statics.createDefaultSuperAdmin = async function() {
  const existingSuperAdmin = await this.findOne({ role: 'superadmin' });
  
  if (!existingSuperAdmin) {
    const defaultSuperAdmin = new this({
      username: 'superadmin',
      email: 'superadmin@invois.com',
      password: 'SuperAdmin123!',
      fullName: 'System Super Administrator',
      role: 'superadmin',
      permissions: {
        userManagement: true,
        systemSettings: true,
        dataAccess: true,
        aiManagement: true
      }
    });
    
    await defaultSuperAdmin.save();
    console.log('✅ Default SuperAdmin created: superadmin@invois.com / SuperAdmin123!');
  }
};

module.exports = mongoose.model('SuperAdmin', superAdminSchema);
