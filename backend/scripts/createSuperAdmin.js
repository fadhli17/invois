const mongoose = require('mongoose');
const SuperAdmin = require('../models/SuperAdmin');
require('dotenv').config();

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/invois');
    console.log('Connected to MongoDB');

    // Create default SuperAdmin
    await SuperAdmin.createDefaultSuperAdmin();
    
    console.log('SuperAdmin account created successfully!');
    console.log('Username: superadmin');
    console.log('Email: superadmin@invois.com');
    console.log('Password: SuperAdmin123!');
    
  } catch (error) {
    console.error('Error creating SuperAdmin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSuperAdmin();
