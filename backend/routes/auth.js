const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, fullName, email } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Username atau email sudah wujud' 
      });
    }

    const user = new User({
      username,
      password,
      fullName,
      email
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Pendaftaran berjaya',
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Username atau password salah' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Username atau password salah' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Akaun anda telah dinyahaktifkan. Sila hubungi pentadbir sistem.' 
      });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Log masuk berjaya',
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email diperlukan' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user doesn't exist for security
      return res.json({ 
        message: 'Jika email wujud dalam sistem, link reset password telah dihantar' 
      });
    }

    // Create password reset token
    const resetRequest = await PasswordReset.createResetRequest(user._id);
    
    // In a real application, you would send an email here
    // For now, we'll return the token in the response for development
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/reset-password?token=${resetRequest.token}`;
    
    console.log(`Password reset link for ${user.email}: ${resetUrl}`);
    
    res.json({ 
      message: 'Jika email wujud dalam sistem, link reset password telah dihantar',
      // Always return resetUrl in development (when NODE_ENV is not production)
      resetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token dan password baru diperlukan' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password mesti sekurang-kurangnya 6 aksara' });
    }

    // Find valid reset token
    const resetRequest = await PasswordReset.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!resetRequest) {
      return res.status(400).json({ message: 'Token tidak sah atau telah tamat tempoh' });
    }

    // Update user password
    const user = resetRequest.userId;
    user.password = newPassword;
    await user.save();

    // Mark token as used
    resetRequest.used = true;
    await resetRequest.save();

    res.json({ message: 'Password berjaya dikemaskini' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Reset Token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const resetRequest = await PasswordReset.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRequest) {
      return res.status(400).json({ message: 'Token tidak sah atau telah tamat tempoh' });
    }

    res.json({ message: 'Token sah' });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;