const express = require('express');
const auth = require('../middleware/auth');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const router = express.Router();

// Debug endpoint to test customer-invoice matching
router.get('/debug/totals', auth, async (req, res) => {
  try {
    console.log('=== DEBUG CUSTOMER TOTALS ===');
    
    // Get all customers
    const customers = await Customer.find({ userId: req.user.id });
    console.log('Found customers:', customers.length);
    
    // Get all invoices
    const invoices = await Invoice.find({ userId: req.user.id });
    console.log('Found invoices:', invoices.length);
    
    // Test matching for each customer
    const results = [];
    for (const customer of customers) {
      const matchingInvoices = invoices.filter(invoice => 
        invoice.clientEmail && 
        invoice.clientEmail.toLowerCase() === customer.email.toLowerCase()
      );
      
      // Separate invoices and quotes
      const customerInvoices = matchingInvoices.filter(doc => doc.documentType === 'invoice');
      const customerQuotes = matchingInvoices.filter(doc => doc.documentType === 'quote');
      
      const invoiceAmount = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const quoteAmount = customerQuotes.reduce((sum, quote) => sum + (quote.total || 0), 0);
      const totalAmount = invoiceAmount + quoteAmount;
      
      results.push({
        customerName: customer.name,
        customerEmail: customer.email,
        matchingInvoices: matchingInvoices.length,
        invoiceCount: customerInvoices.length,
        quoteCount: customerQuotes.length,
        totalDocuments: customerInvoices.length + customerQuotes.length,
        invoiceAmount: invoiceAmount,
        quoteAmount: quoteAmount,
        totalAmount: totalAmount,
        invoices: matchingInvoices.map(inv => ({
          invoiceNumber: inv.invoiceNumber,
          documentType: inv.documentType,
          clientEmail: inv.clientEmail,
          total: inv.total
        }))
      });
    }
    
    res.json({
      customers: results,
      totalCustomers: customers.length,
      totalInvoices: invoices.length
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ message: 'Debug error', error: error.message });
  }
});

// Get all customers with pagination and search
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    let query = { userId: req.user.id };

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Support totals aggregation for each customer based on invoices
    const includeTotals = req.query.includeTotals !== 'false';

    let customers;
    if (includeTotals) {
      console.log('Running customer aggregation with totals...');
      
      // First get customers without totals
      const baseCustomers = await Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      // Then calculate totals for each customer using aggregation
      customers = await Promise.all(baseCustomers.map(async (customer) => {
        // Use aggregation to get statistics from invoices collection
        const statsPipeline = [
          {
            $match: {
              userId: customer.userId,
              clientEmail: { $regex: new RegExp(`^${customer.email}$`, 'i') }
            }
          },
          {
            $group: {
              _id: '$documentType',
              count: { $sum: 1 },
              totalAmount: { $sum: '$total' },
              lastDate: { $max: '$issueDate' }
            }
          }
        ];

        const statsResult = await Invoice.aggregate(statsPipeline);
        
        // Initialize counters
        let invoiceCount = 0;
        let quoteCount = 0;
        let invoiceAmount = 0;
        let quoteAmount = 0;
        let lastInvoiceDate = null;

        // Process aggregation results
        statsResult.forEach(stat => {
          if (stat._id === 'invoice') {
            invoiceCount = stat.count;
            invoiceAmount = stat.totalAmount || 0;
          } else if (stat._id === 'quote') {
            quoteCount = stat.count;
            quoteAmount = stat.totalAmount || 0;
          }
          
          // Track the most recent date
          if (stat.lastDate && (!lastInvoiceDate || stat.lastDate > lastInvoiceDate)) {
            lastInvoiceDate = stat.lastDate;
          }
        });

        const totalDocuments = invoiceCount + quoteCount;
        const totalAmount = invoiceAmount + quoteAmount;

        console.log(`Customer ${customer.name}: invoices=${invoiceCount}, quotes=${quoteCount}, total=${totalAmount}`);
        
        return {
          ...customer.toObject(),
          totalInvoices: totalDocuments, // Keep for backward compatibility
          totalAmount: totalAmount,
          lastInvoiceDate: lastInvoiceDate ? new Date(lastInvoiceDate) : null,
          // New detailed statistics
          invoiceCount,
          quoteCount,
          totalDocuments,
          invoiceAmount,
          quoteAmount
        };
      }));
      
      console.log('Customers with totals:', customers.map(c => ({
        name: c.name,
        email: c.email,
        totalInvoices: c.totalInvoices,
        totalAmount: c.totalAmount
      })));
    } else {
      customers = await Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single customer
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Pelanggan tidak dijumpai' });
    }

    // Use aggregation to get statistics from invoices collection
    const statsPipeline = [
      {
        $match: {
          userId: customer.userId,
          clientEmail: { $regex: new RegExp(`^${customer.email}$`, 'i') }
        }
      },
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          lastDate: { $max: '$issueDate' }
        }
      }
    ];

    const statsResult = await Invoice.aggregate(statsPipeline);
    
    console.log(`=== CUSTOMER STATS DEBUG for ${customer.name} (${customer.email}) ===`);
    console.log('Customer userId:', customer.userId);
    console.log('Customer email:', customer.email);
    console.log('Aggregation pipeline:', JSON.stringify(statsPipeline, null, 2));
    console.log('Aggregation result:', statsResult);
    
    // Also check raw documents to see what's in the database
    const rawDocs = await Invoice.find({
      userId: customer.userId,
      clientEmail: { $regex: new RegExp(`^${customer.email}$`, 'i') }
    });
    console.log('Raw documents found:', rawDocs.length);
    console.log('Raw documents:', rawDocs.map(doc => ({
      invoiceNumber: doc.invoiceNumber,
      documentType: doc.documentType,
      total: doc.total,
      clientEmail: doc.clientEmail,
      userId: doc.userId
    })));

    // Initialize counters
    let invoiceCount = 0;
    let quoteCount = 0;
    let invoiceAmount = 0;
    let quoteAmount = 0;
    let lastInvoiceDate = null;

    // Process aggregation results
    statsResult.forEach(stat => {
      if (stat._id === 'invoice') {
        invoiceCount = stat.count;
        invoiceAmount = stat.totalAmount || 0;
      } else if (stat._id === 'quote') {
        quoteCount = stat.count;
        quoteAmount = stat.totalAmount || 0;
      }
      
      // Track the most recent date
      if (stat.lastDate && (!lastInvoiceDate || stat.lastDate > lastInvoiceDate)) {
        lastInvoiceDate = stat.lastDate;
      }
    });

    const totalDocuments = invoiceCount + quoteCount;
    const totalAmount = invoiceAmount + quoteAmount;

    console.log('Final stats:', {
      invoiceCount,
      quoteCount,
      totalDocuments,
      invoiceAmount,
      quoteAmount,
      totalAmount,
      lastInvoiceDate
    });
    console.log('=== END DEBUG ===');

    // Return customer with enhanced statistics
    const customerWithStats = {
      ...customer.toObject(),
      invoiceCount,
      quoteCount,
      totalDocuments,
      invoiceAmount,
      quoteAmount,
      totalAmount,
      lastInvoiceDate: lastInvoiceDate ? new Date(lastInvoiceDate) : null
    };

    res.json(customerWithStats);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new customer
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      address,
      taxNumber,
      notes,
      status
    } = req.body;

    // Check if email already exists for this user
    const existingCustomer = await Customer.findOne({
      userId: req.user.id,
      email: email.toLowerCase()
    });

    if (existingCustomer) {
      return res.status(400).json({ message: 'Email pelanggan sudah wujud' });
    }

    const customer = new Customer({
      userId: req.user.id,
      name,
      email: email.toLowerCase(),
      phone,
      company,
      address,
      taxNumber,
      notes,
      status: status || 'active'
    });

    await customer.save();

    res.status(201).json({
      message: 'Pelanggan berjaya ditambah',
      customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update customer
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      address,
      taxNumber,
      notes,
      status
    } = req.body;

    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Pelanggan tidak dijumpai' });
    }

    // Check if email already exists for another customer
    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({
        userId: req.user.id,
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      });

      if (existingCustomer) {
        return res.status(400).json({ message: 'Email pelanggan sudah wujud' });
      }
    }

    // Update fields
    customer.name = name || customer.name;
    customer.email = email ? email.toLowerCase() : customer.email;
    customer.phone = phone || customer.phone;
    customer.company = company || customer.company;
    customer.address = address || customer.address;
    customer.taxNumber = taxNumber || customer.taxNumber;
    customer.notes = notes || customer.notes;
    customer.status = status || customer.status;

    await customer.save();

    res.json({
      message: 'Pelanggan berjaya dikemaskini',
      customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete customer
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Pelanggan tidak dijumpai' });
    }

    // Check if customer has invoices (optional - you might want to prevent deletion)
    // const Invoice = require('../models/Invoice');
    // const invoiceCount = await Invoice.countDocuments({ customerId: req.params.id });
    // if (invoiceCount > 0) {
    //   return res.status(400).json({ message: 'Tidak boleh padam pelanggan yang mempunyai invois' });
    // }

    await Customer.findByIdAndDelete(req.params.id);

    res.json({ message: 'Pelanggan berjaya dipadam' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({ userId: req.user.id });
    const activeCustomers = await Customer.countDocuments({ 
      userId: req.user.id, 
      status: 'active' 
    });
    const inactiveCustomers = await Customer.countDocuments({ 
      userId: req.user.id, 
      status: 'inactive' 
    });

    // Get top customers by total amount
    const topCustomers = await Customer.find({ userId: req.user.id })
      .sort({ totalAmount: -1 })
      .limit(5)
      .select('name totalAmount totalInvoices');

    res.json({
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      topCustomers
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test endpoint to verify customer statistics (no auth for debugging)
router.get('/test/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Pelanggan tidak dijumpai' });
    }

    // Get customer's invoices and quotes separately
    const customerInvoices = await Invoice.find({
      userId: customer.userId,
      clientEmail: { $regex: new RegExp(`^${customer.email}$`, 'i') }
    });

    // Separate invoices and quotes
    const invoices = customerInvoices.filter(doc => doc.documentType === 'invoice');
    const quotes = customerInvoices.filter(doc => doc.documentType === 'quote');

    // Calculate statistics
    const invoiceCount = invoices.length;
    const quoteCount = quotes.length;
    const totalDocuments = invoiceCount + quoteCount;

    const invoiceAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const quoteAmount = quotes.reduce((sum, quote) => sum + (quote.total || 0), 0);
    const totalAmount = invoiceAmount + quoteAmount;

    const lastInvoiceDate = customerInvoices.length > 0 
      ? Math.max(...customerInvoices.map(inv => new Date(inv.issueDate).getTime()))
      : null;

    // Return detailed test data
    res.json({
      customer: {
        name: customer.name,
        email: customer.email
      },
      rawData: {
        totalDocuments: customerInvoices.length,
        documents: customerInvoices.map(doc => ({
          invoiceNumber: doc.invoiceNumber,
          documentType: doc.documentType,
          total: doc.total,
          clientEmail: doc.clientEmail
        }))
      },
      calculatedStats: {
        invoiceCount,
        quoteCount,
        totalDocuments,
        invoiceAmount,
        quoteAmount,
        totalAmount,
        lastInvoiceDate: lastInvoiceDate ? new Date(lastInvoiceDate) : null
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug endpoint to check all customers and their invoices
router.get('/debug/all', async (req, res) => {
  try {
    const customers = await Customer.find({});
    const invoices = await Invoice.find({});
    
    const result = customers.map(customer => {
      const customerInvoices = invoices.filter(invoice => 
        invoice.clientEmail && 
        invoice.clientEmail.toLowerCase() === customer.email.toLowerCase()
      );
      
      const invoiceCount = customerInvoices.filter(doc => doc.documentType === 'invoice').length;
      const quoteCount = customerInvoices.filter(doc => doc.documentType === 'quote').length;
      const invoiceAmount = customerInvoices
        .filter(doc => doc.documentType === 'invoice')
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
      const quoteAmount = customerInvoices
        .filter(doc => doc.documentType === 'quote')
        .reduce((sum, quote) => sum + (quote.total || 0), 0);
      
      return {
        customerId: customer._id,
        customerName: customer.name,
        customerEmail: customer.email,
        totalDocuments: customerInvoices.length,
        invoiceCount,
        quoteCount,
        invoiceAmount,
        quoteAmount,
        totalAmount: invoiceAmount + quoteAmount,
        documents: customerInvoices.map(doc => ({
          invoiceNumber: doc.invoiceNumber,
          documentType: doc.documentType,
          total: doc.total,
          clientEmail: doc.clientEmail
        }))
      };
    });
    
    res.json({
      customers: result,
      totalCustomers: customers.length,
      totalInvoices: invoices.length
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ message: 'Debug error', error: error.message });
  }
});

module.exports = router;
