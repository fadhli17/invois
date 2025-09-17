const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoices');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const logoRoutes = require('./routes/logos');
const uploadRoutes = require('./routes/uploads');
const aiRoutes = require('./routes/ai');
const superAdminRoutes = require('./routes/superAdmin');

const app = express();

// Configure CORS to allow access from network
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://192.168.68.102:3002', 'http://127.0.0.1:3000', 'http://127.0.0.1:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/invois', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', async () => {
  console.log('Connected to MongoDB');
  
  // Initialize default SuperAdmin
  try {
    const SuperAdmin = require('./models/SuperAdmin');
    await SuperAdmin.createDefaultSuperAdmin();
  } catch (error) {
    console.error('Error creating default SuperAdmin:', error);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/logos', logoRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/superadmin', superAdminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Invoice Management System API' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access from network: http://192.168.68.102:${PORT}`);
  console.log(`Access locally: http://localhost:${PORT}`);
});
