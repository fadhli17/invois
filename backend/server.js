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
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://192.168.68.102:3002',
    'http://98.88.17.102',           // VPS IP
    'http://98.88.17.102:3000',      // VPS Frontend
    'http://98.88.17.102:3001',      // VPS Backend
    'https://98.88.17.102',          // VPS HTTPS
    'https://98.88.17.102:3000',     // VPS HTTPS Frontend
    'https://98.88.17.102:3001'      // VPS HTTPS Backend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/logos', require('./routes/logos'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/superadmin', require('./routes/superAdmin'));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/invois', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Access: http://98.88.17.102:${PORT}`);
  console.log(`🌐 Access locally: http://localhost:${PORT}`);
});

module.exports = app;