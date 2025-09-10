const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create index for token and expiresAt
passwordResetSchema.index({ token: 1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate reset token
passwordResetSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Static method to create reset request
passwordResetSchema.statics.createResetRequest = async function(userId) {
  // Remove any existing tokens for this user
  await this.deleteMany({ userId, used: false });
  
  // Create new token
  const token = this.generateToken();
  const resetRequest = new this({
    userId,
    token
  });
  
  await resetRequest.save();
  return resetRequest;
};

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
