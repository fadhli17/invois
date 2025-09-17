const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');

// Middleware to verify superadmin token
const verifySuperAdminToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Akses ditolak. Token diperlukan.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if superadmin exists and is active
    const superAdmin = await SuperAdmin.findById(decoded.id).select('-password');
    
    if (!superAdmin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token tidak sah.' 
      });
    }

    if (!superAdmin.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Akaun superadmin telah dinyahaktifkan.' 
      });
    }

    if (superAdmin.isLocked) {
      return res.status(401).json({ 
        success: false, 
        message: 'Akaun superadmin telah dikunci. Sila hubungi pentadbir sistem.' 
      });
    }

    req.superAdmin = superAdmin;
    next();
  } catch (error) {
    console.error('SuperAdmin Auth Error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Token tidak sah.' 
    });
  }
};

// Middleware to check specific permissions
const checkSuperAdminPermission = (permission) => {
  return (req, res, next) => {
    if (!req.superAdmin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Akses ditolak. Sila log masuk sebagai superadmin.' 
      });
    }

    if (req.superAdmin.role === 'superadmin') {
      // Superadmin has all permissions
      return next();
    }

    if (!req.superAdmin.permissions[permission]) {
      return res.status(403).json({ 
        success: false, 
        message: `Akses ditolak. Anda tidak mempunyai kebenaran untuk ${permission}.` 
      });
    }

    next();
  };
};

// Middleware to check if user is superadmin (not just admin)
const requireSuperAdmin = (req, res, next) => {
  if (!req.superAdmin) {
    return res.status(401).json({ 
      success: false, 
      message: 'Akses ditolak. Sila log masuk sebagai superadmin.' 
    });
  }

  if (req.superAdmin.role !== 'superadmin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Akses ditolak. Hanya superadmin yang dibenarkan.' 
    });
  }

  next();
};

module.exports = {
  verifySuperAdminToken,
  checkSuperAdminPermission,
  requireSuperAdmin
};
