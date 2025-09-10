const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
});

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  note: {
    type: String,
    default: ''
  }
}, {
  _id: true
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },
  documentType: {
    type: String,
    enum: ['invoice', 'quote'],
    default: 'invoice'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Sender (Company) Information
  senderCompanyName: {
    type: String,
    required: true
  },
  senderCompanyAddress: {
    type: String,
    required: true
  },
  senderCompanyPhone: {
    type: String,
    default: ''
  },
  senderCompanyEmail: {
    type: String,
    required: true
  },
  senderCompanyRegistrationNo: {
    type: String,
    default: ''
  },
  senderBankAccount: {
    type: String,
    default: ''
  },
  senderBankName: {
    type: String,
    default: ''
  },
  paymentQRCode: {
    type: String, // File path to uploaded payment QR image
    default: ''
  },
  companyLogo: {
    type: String, // File path to uploaded logo
    default: ''
  },
  // Client Information
  clientName: {
    type: String,
    required: true
  },
  clientCompany: {
    type: String,
    default: ''
  },
  clientEmail: {
    type: String,
    required: true
  },
  clientAddress: {
    type: String,
    required: true
  },
  clientPhone: {
    type: String,
    default: ''
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [invoiceItemSchema],
  freeformItems: {
    type: String,
    default: ''
  },
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  discountType: {
    type: String,
    enum: ['amount', 'percent'],
    default: 'amount'
  },
  tax: {
    type: Number,
    default: 0
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  payments: [paymentSchema],
  total: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'RM'
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue'],
    default: 'draft'
  },
  notes: {
    type: String,
    default: ''
  },
  // Terms and Conditions
  termsAndConditions: {
    type: String,
    default: 'Terma dan Syarat:\n1. Pembayaran hendaklah dibuat dalam tempoh 30 hari dari tarikh invois.\n2. Bayaran lewat akan dikenakan faedah 1.5% sebulan.\n3. Barang yang dihantar tidak boleh dipulangkan tanpa kebenaran bertulis.\n4. Sebarang pertikaian akan diselesaikan mengikut undang-undang Malaysia.'
  }
}, {
  timestamps: true
});

invoiceSchema.pre('save', async function(next) {
  // Only generate invoice number for new documents
  if (this.isNew && !this.invoiceNumber) {
    try {
      console.log('Generating invoice number for new invoice...');
      
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      // Find the highest invoice number for this month based on document type
      const docPrefix = this.documentType === 'quote' ? 'QUO' : 'INV';
      const prefix = `${docPrefix}-${year}${month}`;
      const Invoice = this.constructor; // Get the model
      
      console.log('Looking for existing invoices with prefix:', prefix);
      
      const lastInvoice = await Invoice
        .findOne({ invoiceNumber: { $regex: `^${prefix}` } })
        .sort({ invoiceNumber: -1 })
        .exec();
      
      let sequence = 1;
      if (lastInvoice) {
        console.log('Last invoice found:', lastInvoice.invoiceNumber);
        const parts = lastInvoice.invoiceNumber.split('-');
        if (parts.length === 3) {
          const lastSequence = parseInt(parts[2]) || 0;
          sequence = lastSequence + 1;
        }
      }
      
      this.invoiceNumber = `${prefix}-${String(sequence).padStart(3, '0')}`;
      console.log('Generated invoice number:', this.invoiceNumber);
      
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number if there's an error
      const timestamp = Date.now().toString().slice(-6);
      const docPrefix = this.documentType === 'quote' ? 'QUO' : 'INV';
      this.invoiceNumber = `${docPrefix}-${timestamp}`;
      console.log('Fallback invoice number:', this.invoiceNumber);
    }
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
