const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Logo = require('../models/Logo');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `logo-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload logo
router.post('/upload', auth, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Deactivate previous logos for this user
    await Logo.updateMany(
      { userId: req.user.id, isActive: true },
      { isActive: false }
    );

    // Create new logo record
    const logo = new Logo({
      userId: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/logos/${req.file.filename}`
    });

    await logo.save();

    res.json({
      message: 'Logo uploaded successfully',
      logo: {
        id: logo._id,
        filename: logo.filename,
        originalName: logo.originalName,
        url: logo.url,
        size: logo.size,
        mimetype: logo.mimetype
      }
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ message: 'Server error during logo upload' });
  }
});

// Get current logo
router.get('/current', auth, async (req, res) => {
  try {
    const logo = await Logo.findOne({ 
      userId: req.user.id, 
      isActive: true 
    });

    if (!logo) {
      return res.json({ logo: null });
    }

    res.json({
      logo: {
        id: logo._id,
        filename: logo.filename,
        originalName: logo.originalName,
        url: logo.url,
        size: logo.size,
        mimetype: logo.mimetype
      }
    });
  } catch (error) {
    console.error('Get logo error:', error);
    res.status(500).json({ message: 'Server error getting logo' });
  }
});

// Delete logo
router.delete('/:id', auth, async (req, res) => {
  try {
    const logo = await Logo.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!logo) {
      return res.status(404).json({ message: 'Logo not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../uploads/logos', logo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await Logo.findByIdAndDelete(req.params.id);

    res.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({ message: 'Server error deleting logo' });
  }
});

// Get logo history
router.get('/history', auth, async (req, res) => {
  try {
    const logos = await Logo.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('filename originalName url size mimetype isActive createdAt');

    res.json({ logos });
  } catch (error) {
    console.error('Get logo history error:', error);
    res.status(500).json({ message: 'Server error getting logo history' });
  }
});

module.exports = router;

