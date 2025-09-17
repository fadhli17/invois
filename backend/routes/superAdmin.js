const express = require('express');
const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { verifySuperAdminToken, checkSuperAdminPermission, requireSuperAdmin } = require('../middleware/superAdminAuth');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// SuperAdmin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password diperlukan.'
      });
    }

    // Find superadmin by username or email
    const superAdmin = await SuperAdmin.findOne({
      $or: [
        { username: username },
        { email: username }
      ]
    });

    if (!superAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Kredensial tidak sah.'
      });
    }

    // Check if account is locked
    if (superAdmin.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Akaun telah dikunci. Sila cuba lagi kemudian.'
      });
    }

    // Check if account is active
    if (!superAdmin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Akaun telah dinyahaktifkan.'
      });
    }

    // Verify password
    const isPasswordValid = await superAdmin.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await superAdmin.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Kredensial tidak sah.'
      });
    }

    // Reset login attempts and update last login
    await superAdmin.resetLoginAttempts();
    await superAdmin.updateLastLogin();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: superAdmin._id, 
        role: 'superadmin',
        permissions: superAdmin.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Log masuk berjaya.',
      token,
      superAdmin: {
        id: superAdmin._id,
        username: superAdmin.username,
        email: superAdmin.email,
        fullName: superAdmin.fullName,
        role: superAdmin.role,
        permissions: superAdmin.permissions,
        lastLogin: superAdmin.lastLogin
      }
    });

  } catch (error) {
    console.error('SuperAdmin Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat server semasa log masuk.'
    });
  }
});

// Get SuperAdmin Profile
router.get('/profile', verifySuperAdminToken, async (req, res) => {
  try {
    res.json({
      success: true,
      superAdmin: {
        id: req.superAdmin._id,
        username: req.superAdmin.username,
        email: req.superAdmin.email,
        fullName: req.superAdmin.fullName,
        role: req.superAdmin.role,
        permissions: req.superAdmin.permissions,
        lastLogin: req.superAdmin.lastLogin,
        createdAt: req.superAdmin.createdAt
      }
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mendapatkan profil.'
    });
  }
});

// Check User Status (Public endpoint for login page)
router.post('/check-user-status', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.json({
        success: false,
        message: 'Username diperlukan'
      });
    }

    const user = await User.findOne({ username });
    
    if (!user) {
      return res.json({
        success: false,
        message: 'Pengguna tidak ditemui',
        user: null
      });
    }

    res.json({
      success: true,
      user: {
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      message: user.isActive ? 'Akaun aktif' : 'Akaun dinyahaktifkan'
    });
  } catch (error) {
    console.error('Check User Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa menyemak status pengguna'
    });
  }
});

// Get System Statistics
router.get('/stats', verifySuperAdminToken, checkSuperAdminPermission('dataAccess'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const totalInvoices = await Invoice.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalSuperAdmins = await SuperAdmin.countDocuments();

    // Revenue statistics
    const revenueStats = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          paidRevenue: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] 
            } 
          },
          pendingRevenue: { 
            $sum: { 
              $cond: [{ $in: ['$status', ['sent', 'draft']] }, '$total', 0] 
            } 
          },
          overdueRevenue: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'overdue'] }, '$total', 0] 
            } 
          }
        }
      }
    ]);

    const revenue = revenueStats[0] || {
      totalRevenue: 0,
      paidRevenue: 0,
      pendingRevenue: 0,
      overdueRevenue: 0
    };

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const recentInvoices = await Invoice.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          recent: recentUsers
        },
        documents: {
          totalInvoices,
          totalCustomers,
          recentInvoices
        },
        revenue: {
          total: revenue.totalRevenue,
          paid: revenue.paidRevenue,
          pending: revenue.pendingRevenue,
          overdue: revenue.overdueRevenue
        },
        system: {
          totalSuperAdmins
        }
      }
    });
  } catch (error) {
    console.error('Get Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mendapatkan statistik sistem.'
    });
  }
});

// Get All Users
router.get('/users', verifySuperAdminToken, checkSuperAdminPermission('userManagement'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status !== 'all') {
      query.isActive = status === 'active';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(totalUsers / limit),
        total: totalUsers
      }
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mendapatkan senarai pengguna.'
    });
  }
});

// Toggle User Status
router.patch('/users/:userId/toggle-status', verifySuperAdminToken, checkSuperAdminPermission('userManagement'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemui.'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Pengguna ${user.isActive ? 'diaktifkan' : 'dinyahaktifkan'} dengan berjaya.`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Toggle User Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mengubah status pengguna.'
    });
  }
});

// Delete User
router.delete('/users/:userId', verifySuperAdminToken, checkSuperAdminPermission('userManagement'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemui.'
      });
    }

    // Check if user has any invoices or customers
    const userInvoices = await Invoice.countDocuments({ userId });
    const userCustomers = await Customer.countDocuments({ userId });

    if (userInvoices > 0 || userCustomers > 0) {
      return res.status(400).json({
        success: false,
        message: `Tidak boleh memadam pengguna. Pengguna ini mempunyai ${userInvoices} invois dan ${userCustomers} pelanggan.`
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Pengguna berjaya dipadam.'
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa memadam pengguna.'
    });
  }
});

// Update User Details
router.patch('/users/:userId', verifySuperAdminToken, checkSuperAdminPermission('userManagement'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, fullName, email, company, phone, address, isActive } = req.body || {};

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemui.' });
    }

    // Uniqueness checks when fields are changing
    if (typeof username === 'string' && username.trim() && username !== user.username) {
      const exists = await User.findOne({ username: username.trim(), _id: { $ne: userId } });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Username sudah digunakan.' });
      }
      user.username = username.trim();
    }

    if (typeof email === 'string' && email.trim() && email !== user.email) {
      const exists = await User.findOne({ email: email.trim(), _id: { $ne: userId } });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Email sudah digunakan.' });
      }
      user.email = email.trim();
    }

    if (typeof fullName === 'string' && fullName.trim()) user.fullName = fullName.trim();
    if (typeof company === 'string') user.company = company.trim();
    if (typeof phone === 'string') user.phone = phone.trim();
    if (typeof address === 'string') user.address = address.trim();
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    const sanitized = user.toObject();
    delete sanitized.password;

    res.json({ success: true, message: 'Butiran pengguna dikemas kini.', user: sanitized });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ success: false, message: 'Ralat semasa mengemas kini pengguna.' });
  }
});

// Get User Details
router.get('/users/:userId', verifySuperAdminToken, checkSuperAdminPermission('userManagement'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemui.'
      });
    }

    // Get user's statistics
    const userStats = await Invoice.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          paidRevenue: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] 
            } 
          }
        }
      }
    ]);

    const stats = userStats[0] || {
      totalInvoices: 0,
      totalRevenue: 0,
      paidRevenue: 0
    };

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        stats
      }
    });
  } catch (error) {
    console.error('Get User Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mendapatkan butiran pengguna.'
    });
  }
});

// Create New SuperAdmin
router.post('/create-superadmin', verifySuperAdminToken, requireSuperAdmin, async (req, res) => {
  try {
    const { username, email, password, fullName, role = 'admin', permissions } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Semua medan diperlukan.'
      });
    }

    // Check if username or email already exists
    const existingSuperAdmin = await SuperAdmin.findOne({
      $or: [{ username }, { email }]
    });

    if (existingSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Username atau email sudah wujud.'
      });
    }

    const newSuperAdmin = new SuperAdmin({
      username,
      email,
      password,
      fullName,
      role,
      permissions: permissions || {
        userManagement: role === 'superadmin',
        systemSettings: role === 'superadmin',
        dataAccess: true,
        aiManagement: true
      }
    });

    await newSuperAdmin.save();

    res.status(201).json({
      success: true,
      message: 'SuperAdmin baru berjaya dicipta.',
      superAdmin: {
        id: newSuperAdmin._id,
        username: newSuperAdmin.username,
        email: newSuperAdmin.email,
        fullName: newSuperAdmin.fullName,
        role: newSuperAdmin.role,
        permissions: newSuperAdmin.permissions
      }
    });
  } catch (error) {
    console.error('Create SuperAdmin Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mencipta SuperAdmin.'
    });
  }
});

// Get All SuperAdmins
router.get('/superadmins', verifySuperAdminToken, requireSuperAdmin, async (req, res) => {
  try {
    const superAdmins = await SuperAdmin.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      superAdmins
    });
  } catch (error) {
    console.error('Get SuperAdmins Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mendapatkan senarai SuperAdmin.'
    });
  }
});

// System Health Check
router.get('/health', verifySuperAdminToken, async (req, res) => {
  try {
    const conn = mongoose.connection;
    const dbStateMap = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const dbState = dbStateMap[conn.readyState] || 'unknown';
    const dbInfo = {
      state: dbState,
      name: (conn && conn.name) || undefined,
      host: (conn && conn.host) || undefined
    };

    const aiKey = process.env.GROQ_API_KEY || '';
    const aiConfigured = Boolean(aiKey);
    // Try quick AI reachability test (non-blocking minimal call)
    let aiReachable = false;
    let aiLastError = undefined;
    try {
      if (global.__groqMCPServer && global.__groqMCPServer.groq) {
        const client = global.__groqMCPServer.groq;
        const model = (global.__groqMCPServer && global.__groqMCPServer.model) || 'llama-3.1-8b-instant';
        // Very small request to verify connectivity
        await client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
          temperature: 0
        });
        aiReachable = true;
      }
    } catch (err) {
      aiLastError = err?.message || 'unknown-error';
    }

    const aiService = {
      provider: 'Groq',
      configured: aiConfigured,
      clientInitialized: Boolean(global.__groqMCPServer && global.__groqMCPServer.groq),
      model: (global.__groqMCPServer && global.__groqMCPServer.model) || 'llama-3.1-8b-instant',
      reachable: aiReachable,
      lastError: aiLastError
    };

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbInfo,
        ai: aiService,
        jwt: 'active'
      },
      uptime: process.uptime()
    };

    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('Health Check Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa memeriksa kesihatan sistem.'
    });
  }
});

// Get AI Config (masked)
router.get('/ai-config', verifySuperAdminToken, checkSuperAdminPermission('aiManagement'), async (req, res) => {
  try {
    const key = process.env.GROQ_API_KEY || '';
    const masked = key ? (key.length <= 8 ? '*'.repeat(key.length) : key.slice(0, 4) + '*'.repeat(Math.max(0, key.length - 8)) + key.slice(-4)) : '';
    const aiAccessEnabled = global.__aiAccessEnabled !== undefined ? global.__aiAccessEnabled : true; // Default to enabled
    res.json({ 
      success: true, 
      configured: Boolean(key), 
      maskedKey: masked, 
      model: (global.__groqMCPServer && global.__groqMCPServer.model) || 'llama-3.1-8b-instant',
      enabled: aiAccessEnabled
    });
  } catch (error) {
    console.error('Get AI Config Error:', error);
    res.status(500).json({ success: false, message: 'Ralat semasa mendapatkan konfigurasi AI' });
  }
});

// Get Database Status
router.get('/db-status', verifySuperAdminToken, checkSuperAdminPermission('systemSettings'), async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const connectionTime = Date.now() - startTime;
    
    // Connection states: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const connected = connectionState === 1;
    
    // Get connection info
    const host = mongoose.connection.host || 'Unknown';
    const port = mongoose.connection.port || 'Unknown';
    const name = mongoose.connection.name || 'Unknown';
    
    res.json({
      success: true,
      connected,
      host,
      port,
      name,
      connectionTime,
      state: connected ? 'connected' : 'disconnected',
      readyState: connectionState
    });
  } catch (error) {
    console.error('Database Status Error:', error);
    res.json({
      success: true,
      connected: false,
      host: 'Unknown',
      port: 'Unknown',
      name: 'Unknown',
      connectionTime: 0,
      state: 'disconnected',
      error: error.message
    });
  }
});

// Get System Status
router.get('/system-status', verifySuperAdminToken, checkSuperAdminPermission('systemSettings'), async (req, res) => {
  try {
    const os = require('os');
    const process = require('process');
    
    // Check if system is responsive
    const active = true; // System is running if we can respond to this request
    
    // Get system info
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    res.json({
      success: true,
      active,
      uptime: Math.floor(uptime),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      pid: process.pid
    });
  } catch (error) {
    console.error('System Status Error:', error);
    res.json({
      success: true,
      active: false,
      error: error.message
    });
  }
});

// Get System Metrics
router.get('/system-metrics', verifySuperAdminToken, checkSuperAdminPermission('systemSettings'), async (req, res) => {
  try {
    const os = require('os');
    const process = require('process');
    
    // Get CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    const cpuPercent = Math.min(100, Math.round((cpuUsage.user + cpuUsage.system) / 1000000)); // Convert to percentage
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercent = Math.round((usedMemory / totalMemory) * 100);
    
    // Get disk usage (simplified)
    const diskUsage = {
      total: totalMemory, // Using memory as proxy for disk
      used: usedMemory,
      free: freeMemory
    };
    const diskPercent = Math.round((usedMemory / totalMemory) * 100);
    
    // Get load average
    const loadAverage = os.loadavg();
    
    // Get process count (simplified)
    const processCount = Math.floor(Math.random() * 100) + 50; // Mock data
    
    res.json({
      success: true,
      metrics: {
        cpu: cpuPercent,
        memory: usedMemory,
        memoryPercent: memoryPercent,
        disk: usedMemory,
        diskPercent: diskPercent,
        loadAverage: loadAverage[0].toFixed(2),
        processCount: processCount
      },
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('System Metrics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mendapatkan metrik sistem.'
    });
  }
});

// Get Recent Activities
router.get('/recent-activities', verifySuperAdminToken, checkSuperAdminPermission('dataAccess'), async (req, res) => {
  try {
    // Mock recent activities data
    const activities = [
      {
        action: 'User login',
        user: 'admin@example.com',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        type: 'login'
      },
      {
        action: 'Invoice created',
        user: 'user1@example.com',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        type: 'invoice'
      },
      {
        action: 'Customer updated',
        user: 'user2@example.com',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        type: 'customer'
      },
      {
        action: 'System backup',
        user: 'System',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        type: 'system'
      },
      {
        action: 'User registered',
        user: 'newuser@example.com',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        type: 'user'
      }
    ];
    
    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Recent Activities Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mendapatkan aktiviti terkini.'
    });
  }
});

// Get Security Logs
router.get('/security-logs', verifySuperAdminToken, checkSuperAdminPermission('dataAccess'), async (req, res) => {
  try {
    // Mock security logs data
    const logs = [
      {
        level: 'info',
        message: 'Successful login attempt',
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        user: 'admin@example.com',
        ip: '192.168.1.100'
      },
      {
        level: 'warning',
        message: 'Failed login attempt',
        timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        user: 'unknown@example.com',
        ip: '192.168.1.101'
      },
      {
        level: 'error',
        message: 'Invalid API key used',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        user: 'System',
        ip: '192.168.1.102'
      },
      {
        level: 'info',
        message: 'Password changed',
        timestamp: new Date(Date.now() - 90 * 60 * 1000), // 1.5 hours ago
        user: 'user1@example.com',
        ip: '192.168.1.100'
      },
      {
        level: 'warning',
        message: 'Suspicious activity detected',
        timestamp: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
        user: 'System',
        ip: '192.168.1.103'
      }
    ];
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Security Logs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mendapatkan log keselamatan.'
    });
  }
});

// Get Backup Status
router.get('/backup-status', verifySuperAdminToken, checkSuperAdminPermission('systemSettings'), async (req, res) => {
  try {
    // Mock backup status data
    const lastBackup = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours ago
    const backupSize = Math.floor(Math.random() * 1000000000) + 500000000; // Random size between 500MB-1.5GB
    
    res.json({
      success: true,
      lastBackup,
      size: backupSize,
      status: 'success',
      nextBackup: new Date(Date.now() + 18 * 60 * 60 * 1000) // Next backup in 18 hours
    });
  } catch (error) {
    console.error('Backup Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mendapatkan status backup.'
    });
  }
});

// Get Error Logs
router.get('/error-logs', verifySuperAdminToken, checkSuperAdminPermission('dataAccess'), async (req, res) => {
  try {
    // Mock error logs data
    const logs = [
      {
        error: 'Database connection timeout',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        level: 'error',
        source: 'database'
      },
      {
        error: 'API rate limit exceeded',
        timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
        level: 'warning',
        source: 'api'
      },
      {
        error: 'Memory allocation failed',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        level: 'error',
        source: 'system'
      },
      {
        error: 'File upload failed',
        timestamp: new Date(Date.now() - 90 * 60 * 1000), // 1.5 hours ago
        level: 'warning',
        source: 'upload'
      },
      {
        error: 'Email service unavailable',
        timestamp: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
        level: 'error',
        source: 'email'
      }
    ];
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error Logs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mendapatkan log ralat.'
    });
  }
});

// Toggle Maintenance Mode
router.patch('/maintenance-mode', verifySuperAdminToken, checkSuperAdminPermission('systemSettings'), async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Parameter enabled diperlukan (boolean)'
      });
    }
    
    // Store maintenance mode in global variable
    global.__maintenanceMode = enabled;
    
    res.json({
      success: true,
      message: `Maintenance mode ${enabled ? 'diaktifkan' : 'dinonaktifkan'}`,
      maintenanceMode: enabled
    });
  } catch (error) {
    console.error('Maintenance Mode Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mengubah maintenance mode.'
    });
  }
});

// Update AI Key (persist to .env and runtime)
router.patch('/ai-config', verifySuperAdminToken, checkSuperAdminPermission('aiManagement'), async (req, res) => {
  try {
    const { apiKey, enabled } = req.body || {};
    
    console.log('AI Config Update Request:', { apiKey: apiKey ? 'Present' : 'Missing', enabled, body: req.body });
    
    // Handle AI access toggle
    if (typeof enabled === 'boolean') {
      // Store AI access state in global variable
      global.__aiAccessEnabled = enabled;
      console.log('AI Access toggled:', enabled ? 'Enabled' : 'Disabled');
      return res.json({ success: true, message: `Capaian AI ${enabled ? 'diaktifkan' : 'dinonaktifkan'}` });
    }
    
    // Handle API key update - only if apiKey is provided
    if (apiKey !== undefined) {
      if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
        return res.status(400).json({ success: false, message: 'API key diperlukan' });
      }

      const newKey = apiKey.trim();

    // Update runtime
    let runtimeUpdated = false;
    if (global.__groqMCPServer && typeof global.__groqMCPServer.setApiKey === 'function') {
      runtimeUpdated = global.__groqMCPServer.setApiKey(newKey);
      console.log('Groq API key updated in global server:', runtimeUpdated);
    } else {
      process.env.GROQ_API_KEY = newKey;
      runtimeUpdated = true;
      console.log('Groq API key updated in process.env only');
    }

    // Persist to backend/.env
    try {
      const envPath = path.join(__dirname, '..', '.env');
      let content = '';
      try {
        content = fs.readFileSync(envPath, 'utf8');
      } catch {
        content = '';
      }
      if (content.includes('GROQ_API_KEY=')) {
        content = content.replace(/GROQ_API_KEY=.*/g, `GROQ_API_KEY=${newKey}`);
      } else {
        content += (content.endsWith('\n') ? '' : '\n') + `GROQ_API_KEY=${newKey}\n`;
      }
      fs.writeFileSync(envPath, content, 'utf8');
    } catch (fileErr) {
      console.warn('Could not persist GROQ_API_KEY to .env:', fileErr.message);
    }

      return res.json({ success: true, message: 'API key AI dikemas kini', runtimeUpdated });
    }
    
    // If neither enabled nor apiKey is provided
    return res.status(400).json({ success: false, message: 'Parameter tidak sah' });
  } catch (error) {
    console.error('Update AI Config Error:', error);
    res.status(500).json({ success: false, message: 'Ralat semasa mengemas kini API key AI' });
  }
});

// Explicit AI connectivity test
router.get('/ai-test', verifySuperAdminToken, checkSuperAdminPermission('aiManagement'), async (req, res) => {
  try {
    console.log('Testing AI connection...');
    console.log('Global server exists:', !!global.__groqMCPServer);
    console.log('Groq client exists:', !!(global.__groqMCPServer && global.__groqMCPServer.groq));
    console.log('Current API key in env:', process.env.GROQ_API_KEY ? 'Present' : 'Missing');
    
    if (!(global.__groqMCPServer && global.__groqMCPServer.groq)) {
      return res.json({ 
        success: true, 
        reachable: false, 
        message: 'Groq client tidak diinisialisasi. Tetapkan API key dahulu.',
        debug: {
          globalServerExists: !!global.__groqMCPServer,
          groqClientExists: !!(global.__groqMCPServer && global.__groqMCPServer.groq),
          envApiKeyExists: !!process.env.GROQ_API_KEY
        }
      });
    }
    
    const client = global.__groqMCPServer.groq;
    const model = (global.__groqMCPServer && global.__groqMCPServer.model) || 'llama-3.1-8b-instant';
    
    console.log('Testing with model:', model);
    const result = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
      temperature: 0
    });
    
    console.log('AI test successful:', result);
    res.json({ success: true, reachable: true, message: 'Sambungan AI berjaya.' });
  } catch (error) {
    console.error('AI Test Error:', error);
    console.error('Error details:', {
      message: error?.message,
      type: error?.type,
      code: error?.code,
      status: error?.status
    });
    
    res.json({ 
      success: true, 
      reachable: false, 
      message: error?.message || 'Sambungan AI gagal.',
      error: {
        message: error?.message,
        type: error?.type,
        code: error?.code,
        status: error?.status
      }
    });
  }
});

module.exports = router;
