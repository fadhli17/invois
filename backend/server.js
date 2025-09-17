const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Configure CORS to allow access from VPS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:9000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:9000',
    'http://98.88.17.102',
    'http://98.88.17.102:3000',
    'http://98.88.17.102:9000',
    'https://98.88.17.102',
    'https://98.88.17.102:3000',
    'https://98.88.17.102:9000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const invoiceRoutes = require('./routes/invoices');
const logoRoutes = require('./routes/logos');
const uploadRoutes = require('./routes/uploads');
const aiRoutes = require('./routes/ai');
const superAdminRoutes = require('./routes/superAdmin');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/logos', logoRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/superadmin', superAdminRoutes);

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/invois', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', async () => {
  console.log('Connected to MongoDB');
  
  // Initialize default SuperAdmin
  try {
    const SuperAdmin = require('./models/SuperAdmin');
    const existingSuperAdmin = await SuperAdmin.findOne({ username: 'superadmin' });
    
    if (!existingSuperAdmin) {
      const newSuperAdmin = new SuperAdmin({
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
      await newSuperAdmin.save();
      console.log('✅ SuperAdmin account created successfully!');
    } else {
      console.log('✅ SuperAdmin account already exists');
    }
  } catch (error) {
    console.error('❌ Error creating SuperAdmin:', error);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Access: http://98.88.17.102:${PORT}`);
  console.log(`🌐 Access locally: http://localhost:${PORT}`);
});