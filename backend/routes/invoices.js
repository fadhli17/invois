const express = require('express');
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/logos');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya fail imej dibenarkan'), false);
    }
  }
});

// Configure multer for QR uploads
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

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    let query = { userId: req.user.id };

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { clientCompany: { $regex: search, $options: 'i' } },
        { clientEmail: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    res.json({
      invoices,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload logo endpoint
router.post('/upload-logo', auth, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tiada fail dipilih' });
    }

    // Return the file path
    const logoPath = `/uploads/logos/${req.file.filename}`;
    res.json({ 
      success: true, 
      logoPath: logoPath,
      filename: req.file.filename 
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ message: 'Gagal memuat naik logo' });
  }
});

// Upload QR code endpoint
router.post('/upload-qrcode', auth, uploadQr.single('qrcode'), async (req, res) => {
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

router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invois tidak dijumpai' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    console.log('=== CREATE INVOICE DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user?.id);
    
    const {
      // Document type
      documentType,
      // Sender information
      senderCompanyName,
      senderCompanyAddress,
      senderCompanyPhone,
      senderCompanyEmail,
      senderCompanyRegistrationNo,
      senderBankAccount,
      senderBankName,
      companyLogo,
      paymentQRCode,
      // Client information
      clientName,
      clientCompany,
      clientEmail,
      clientAddress,
      clientPhone,
      dueDate,
      items,
      freeformItems,
      tax,
      discount,
      discountType,
      amountPaid,
      payments,
      notes,
      termsAndConditions,
      status
    } = req.body;

    // Quotes must not accept payments
    if (documentType === 'quote') {
      if ((Array.isArray(payments) && payments.length > 0) || ((amountPaid || 0) > 0)) {
        return res.status(400).json({ message: 'Sebut harga tidak menerima pembayaran' });
      }
    }

    console.log('Extracted fields:', {
      documentType,
      senderCompanyName,
      senderCompanyEmail,
      clientName,
      clientCompany,
      clientEmail,
      clientAddress,
      clientPhone,
      dueDate,
      items: items?.length || 'undefined',
      tax,
      notes,
      termsAndConditions: termsAndConditions ? 'provided' : 'default'
    });

    // Validate required fields first
    if (!senderCompanyName || !senderCompanyEmail || !senderCompanyAddress || !clientName || !clientEmail || !clientAddress || !dueDate || !items || items.length === 0) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({ 
        message: 'Sila lengkapkan semua maklumat yang diperlukan termasuk maklumat syarikat pengirim' 
      });
    }

    // Validate date format
    if (!dueDate || isNaN(new Date(dueDate))) {
      console.log('Invalid due date:', dueDate);
      return res.status(400).json({ 
        message: 'Tarikh jatuh tempo tidak sah' 
      });
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      console.log('Invalid client email format:', clientEmail);
      return res.status(400).json({ 
        message: 'Format email pelanggan tidak sah' 
      });
    }
    
    if (!emailRegex.test(senderCompanyEmail)) {
      console.log('Invalid sender email format:', senderCompanyEmail);
      return res.status(400).json({ 
        message: 'Format email syarikat tidak sah' 
      });
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`Validating item ${i}:`, item);
      
      if (!item.description || item.quantity === undefined || item.quantity === null || item.unitPrice === undefined || item.unitPrice === null) {
        console.log(`Item ${i} validation failed`);
        return res.status(400).json({ 
          message: `Setiap item mesti mempunyai penerangan, kuantiti, dan harga unit. Item ${i + 1} tidak lengkap.` 
        });
      }
    }

    let subtotal = 0;
    const processedItems = items.map(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const amount = quantity * unitPrice;
      subtotal += amount;
      return {
        description: item.description,
        quantity: quantity,
        unitPrice: unitPrice,
        amount: amount
      };
    });

    const taxAmount = parseFloat(tax) || 0;
    const discountAmount = parseFloat(discount) || 0;
    const total = subtotal - discountAmount + taxAmount;

    // Check if logo is a file path and delete any existing logo with same name
    if (companyLogo && !companyLogo.startsWith('data:')) {
      const logoPath = path.join(__dirname, '..', companyLogo);
      if (fs.existsSync(logoPath)) {
        // Check if there's another invoice using the same logo
        const existingInvoice = await Invoice.findOne({ 
          companyLogo: companyLogo,
          userId: req.user.id 
        });
        if (existingInvoice) {
          // Delete the file since it's being replaced
          fs.unlinkSync(logoPath);
        }
      }
    }

    console.log('Creating invoice with data:', {
      userId: req.user.id,
      senderCompanyName,
      senderCompanyAddress,
      senderCompanyPhone: senderCompanyPhone || '',
      senderCompanyEmail,
      senderCompanyRegistrationNo: senderCompanyRegistrationNo || '',
      companyLogo: companyLogo || '',
      paymentQRCode: paymentQRCode || '',
      clientName,
      clientCompany: clientCompany || '',
      clientEmail,
      clientAddress,
      clientPhone: clientPhone || '',
      dueDate: new Date(dueDate),
      processedItems,
      subtotal,
      discount: discountAmount,
      discountType: discountType || 'amount',
      tax: taxAmount,
      total,
      notes: notes || '',
      termsAndConditions: termsAndConditions || undefined // Use default from schema
    });

    const invoice = new Invoice({
      // Don't set invoiceNumber - let pre-save hook handle it
      documentType: documentType || 'invoice',
      userId: req.user.id,
      // Sender information
      senderCompanyName,
      senderCompanyAddress,
      senderCompanyPhone: senderCompanyPhone || '',
      senderCompanyEmail,
      senderCompanyRegistrationNo: senderCompanyRegistrationNo || '',
      senderBankAccount: senderBankAccount || '',
      senderBankName: senderBankName || '',
      companyLogo: companyLogo || '',
      paymentQRCode: paymentQRCode || '',
      // Client information
      clientName,
      clientCompany: clientCompany || '',
      clientEmail,
      clientAddress,
      clientPhone: clientPhone || '',
      dueDate: new Date(dueDate),
      items: processedItems,
      freeformItems: freeformItems || '',
      subtotal,
      tax: taxAmount,
      amountPaid: (documentType === 'quote') ? 0 : (amountPaid || 0),
      payments: (documentType === 'quote') ? [] : (payments || []),
      total,
      notes: notes || '',
      termsAndConditions: termsAndConditions || undefined // Use default from schema
    });

    console.log('About to save invoice...');
    await invoice.save();
    console.log('Invoice saved successfully:', invoice.invoiceNumber);

    res.status(201).json({
      message: 'Invois berjaya dicipta',
      invoice
    });
  } catch (error) {
    console.error('=== CREATE INVOICE ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error('Formatted validation errors:', errors);
      return res.status(400).json({ 
        message: 'Data tidak sah', 
        errors: errors 
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyValue);
      return res.status(400).json({ 
        message: 'Nombor invois sudah wujud. Sila cuba lagi.' 
      });
    }
    
    res.status(500).json({ message: 'Ralat server. Sila cuba lagi.', error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invois tidak dijumpai' });
    }

    const {
      // Document type
      documentType,
      // Sender company information
      senderCompanyName,
      senderCompanyAddress,
      senderCompanyPhone,
      senderCompanyEmail,
      senderCompanyRegistrationNo,
      senderBankAccount,
      senderBankName,
      companyLogo,
      paymentQRCode,
      // Client information
      clientName,
      clientCompany,
      clientEmail,
      clientAddress,
      clientPhone,
      dueDate,
      items,
      freeformItems,
      tax,
      discount,
      discountType,
      amountPaid,
      payments,
      status,
      notes,
      termsAndConditions
    } = req.body;

    console.log('=== UPDATE INVOICE DEBUG ===');
    try { console.log('Update request payments length:', Array.isArray(req.body?.payments) ? req.body.payments.length : 'not provided'); } catch (e) {}
    try { console.log('Update request amountPaid:', req.body?.amountPaid); } catch (e) {}

    // Determine effective document type after update
    const effectiveDocType = documentType || invoice.documentType;
    // Quotes must not accept payments
    if (effectiveDocType === 'quote') {
      if ((Array.isArray(payments) && payments.length > 0) || ((amountPaid || 0) > 0)) {
        return res.status(400).json({ message: 'Sebut harga tidak menerima pembayaran' });
      }
    }

    let subtotal = 0;
    const processedItems = items.map(item => {
      const amount = item.quantity * item.unitPrice;
      subtotal += amount;
      return {
        ...item,
        amount
      };
    });

    const taxAmount = tax || 0;
    const discountAmount = discount || 0;
    const total = subtotal - discountAmount + taxAmount;

    // Update sender company information
    if (senderCompanyName) invoice.senderCompanyName = senderCompanyName;
    if (senderCompanyAddress) invoice.senderCompanyAddress = senderCompanyAddress;
    if (senderCompanyPhone !== undefined) invoice.senderCompanyPhone = senderCompanyPhone;
    if (senderCompanyEmail) invoice.senderCompanyEmail = senderCompanyEmail;
    if (senderCompanyRegistrationNo !== undefined) invoice.senderCompanyRegistrationNo = senderCompanyRegistrationNo;
    if (senderBankAccount !== undefined) invoice.senderBankAccount = senderBankAccount;
    if (senderBankName !== undefined) invoice.senderBankName = senderBankName;
    // Handle logo update - delete old file if exists
    if (companyLogo !== undefined && companyLogo !== invoice.companyLogo) {
      // Delete old logo file if it exists and is not a base64 string
      if (invoice.companyLogo && !invoice.companyLogo.startsWith('data:')) {
        const oldLogoPath = path.join(__dirname, '..', invoice.companyLogo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      invoice.companyLogo = companyLogo;
    }

    // Handle QR update - delete old file if exists
    if (paymentQRCode !== undefined && paymentQRCode !== invoice.paymentQRCode) {
      if (invoice.paymentQRCode && !invoice.paymentQRCode.startsWith('data:')) {
        const oldQrPath = path.join(__dirname, '..', invoice.paymentQRCode);
        if (fs.existsSync(oldQrPath)) {
          fs.unlinkSync(oldQrPath);
        }
      }
      invoice.paymentQRCode = paymentQRCode || '';
    }
    
    // Update document type and regenerate number if changed
    if (documentType && documentType !== invoice.documentType) {
      const oldDocumentType = invoice.documentType;
      invoice.documentType = documentType;
      
      // If document type changed, we need to regenerate the invoice number
      // Extract the sequence number from current invoice number
      const currentNumber = invoice.invoiceNumber;
      const parts = currentNumber.split('-');
      
      if (parts.length >= 3) {
        const yearMonth = parts[1]; // e.g., "202501"
        const sequence = parts[2]; // e.g., "001"
        
        // Generate new prefix based on new document type
        const newDocPrefix = documentType === 'quote' ? 'QUO' : 'INV';
        let newInvoiceNumber = `${newDocPrefix}-${yearMonth}-${sequence}`;
        
        // If exists, find next available sequence for this prefix
        const conflict = await Invoice.findOne({ 
          invoiceNumber: newInvoiceNumber,
          _id: { $ne: invoice._id }
        });
        
        if (conflict) {
          // Find the highest sequence for this yearMonth and newDocPrefix, then increment
          const prefix = `${newDocPrefix}-${yearMonth}`;
          const last = await Invoice
            .findOne({ invoiceNumber: { $regex: `^${prefix}` } })
            .sort({ invoiceNumber: -1 })
            .exec();
          let nextSeq = 1;
          if (last) {
            const lastParts = last.invoiceNumber.split('-');
            if (lastParts.length === 3) {
              const lastSeqNum = parseInt(lastParts[2]) || 0;
              nextSeq = lastSeqNum + 1;
            }
          }
          newInvoiceNumber = `${prefix}-${String(nextSeq).padStart(3, '0')}`;
        }
        
        invoice.invoiceNumber = newInvoiceNumber;
        console.log(`Document type changed from ${oldDocumentType} to ${documentType}, invoice number updated to: ${newInvoiceNumber}`);
      }
    } else if (documentType) {
      invoice.documentType = documentType;
    }
    
    // Update client information
    invoice.clientName = clientName;
    invoice.clientCompany = clientCompany || '';
    invoice.clientEmail = clientEmail;
    invoice.clientAddress = clientAddress;
    invoice.clientPhone = clientPhone;
    invoice.dueDate = dueDate;
    invoice.items = processedItems;
    invoice.freeformItems = freeformItems || '';
    invoice.subtotal = subtotal;
    invoice.discount = discountAmount;
    invoice.discountType = discountType || 'amount';
    invoice.tax = taxAmount;
    // Only update payments if the client provided them; avoid clearing existing records
    if (Array.isArray(payments)) {
      console.log('=== BACKEND PAYMENTS DEBUG ===');
      console.log('Payments received:', JSON.stringify(payments, null, 2));
      payments.forEach((payment, index) => {
        console.log(`Payment ${index}:`, {
          amount: payment.amount,
          date: payment.date,
          note: payment.note
        });
      });
      
      invoice.payments = payments;
      // If payments are provided, derive amountPaid from the payments array for consistency
      const derivedPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      invoice.amountPaid = derivedPaid;
      console.log('Derived amountPaid:', derivedPaid);
    } else if (amountPaid !== undefined) {
      // If payments not provided but amountPaid is, update it directly
      invoice.amountPaid = amountPaid || 0;
    }

    // If the updated (or effective) type is quote, force clear payments
    if (effectiveDocType === 'quote') {
      invoice.payments = [];
      invoice.amountPaid = 0;
    }
    invoice.total = total;
    invoice.status = status || invoice.status;
    invoice.notes = notes;
    if (termsAndConditions !== undefined) invoice.termsAndConditions = termsAndConditions;

    await invoice.save();

    res.json({
      message: 'Invois berjaya dikemaskini',
      invoice
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invois tidak dijumpai' });
    }

    // Delete logo file if exists and is not a base64 string
    if (invoice.companyLogo && !invoice.companyLogo.startsWith('data:')) {
      const logoPath = path.join(__dirname, '..', invoice.companyLogo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    await Invoice.deleteOne({ _id: req.params.id });

    res.json({ message: 'Invois berjaya dipadam' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
