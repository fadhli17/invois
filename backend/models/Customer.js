const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  companyRegistrationNo: {
    type: String,
    trim: true
  },
  companyTaxNumber: {
    type: String,
    trim: true
  },
  companyBankName: {
    type: String,
    trim: true
  },
  companyBankAccount: {
    type: String,
    trim: true
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'Malaysia'
    }
  },
  taxNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  totalInvoices: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  lastInvoiceDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
customerSchema.index({ userId: 1, email: 1 });
customerSchema.index({ userId: 1, name: 1 });

// Virtual for full address
customerSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  if (!addr) return '';
  
  const parts = [
    addr.street,
    addr.city,
    addr.state,
    addr.postalCode,
    addr.country
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Ensure virtual fields are serialized
customerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);
