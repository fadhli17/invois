const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, email, company, phone, address } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email sudah digunakan' });
      }
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.company = company || user.company;
    user.phone = phone || user.phone;
    user.address = address || user.address;

    await user.save();

    res.json({
      message: 'Profile berjaya dikemaskini',
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        company: user.company,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Kata laluan semasa dan kata laluan baru diperlukan' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Kata laluan baru mestilah sekurang-kurangnya 6 aksara' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak dijumpai' });
    }

    // Semak kata laluan semasa
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Kata laluan semasa tidak betul' });
    }

    // Set kata laluan baru (akan di-hash secara automatik oleh pre('save') middleware)
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Kata laluan berjaya ditukar'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
