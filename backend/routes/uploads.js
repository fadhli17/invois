const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

const router = express.Router();

const storageQr = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/qrcodes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'qr-' + uniqueSuffix + ext);
  }
});

const uploadQr = multer({
  storage: storageQr,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya fail imej dibenarkan'), false);
    }
  }
});

router.post('/qrcode', auth, uploadQr.single('qrcode'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tiada fail dipilih' });
    }
    const qrPath = `/uploads/qrcodes/${req.file.filename}`;
    res.json({ success: true, qrPath, filename: req.file.filename });
  } catch (error) {
    console.error('QR upload error:', error);
    res.status(500).json({ message: 'Gagal memuat naik kod QR' });
  }
});

module.exports = router;

