/*
  Backfill script: populate invoice.clientCompany for existing documents.
  Strategy:
  - For invoices where clientCompany is missing/null, try to find matching Customer by (userId, email)
  - If found and customer.company exists, set invoice.clientCompany = customer.company
  - Otherwise set to empty string '' to normalize shape
*/

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/invois';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const filter = { $or: [ { clientCompany: { $exists: false } }, { clientCompany: null } ] };
  const totalToFix = await Invoice.countDocuments(filter);
  console.log(`Invoices to backfill: ${totalToFix}`);

  const cursor = Invoice.find(filter).cursor();
  let processed = 0;
  let updated = 0;

  for (let invoice = await cursor.next(); invoice != null; invoice = await cursor.next()) {
    processed++;
    const email = (invoice.clientEmail || '').toLowerCase();
    let company = '';
    try {
      const customer = await Customer.findOne({ userId: invoice.userId, email });
      if (customer && customer.company) {
        company = customer.company;
      }
    } catch (e) {
      console.warn(`Lookup failed for invoice ${invoice._id}:`, e.message);
    }

    invoice.clientCompany = company;
    await invoice.save();
    updated++;
    if (updated % 50 === 0) {
      console.log(`Updated ${updated}/${totalToFix} invoices...`);
    }
  }

  console.log(`Done. Processed: ${processed}, Updated: ${updated}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Backfill error:', err);
  process.exit(1);
});

