/*
 End-to-end check for invoice payments persistence during updates.
 Steps:
 1) Register + login a new user to get JWT
 2) Create an invoice with payments (2 records)
 3) Fetch invoice and assert payments length == 2
 4) Update invoice WITHOUT sending payments and change notes
 5) Fetch invoice and assert payments are still present (length == 2)
 6) Update invoice WITH an extra payment (3rd record) and verify
*/

const API = 'http://localhost:3001/api';

async function run() {
  const unique = Date.now();
  const username = `tester_${unique}`;
  const password = 'Test12345!';
  let token;
  let invoiceId;

  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  try {
    // 1) Register
    await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        fullName: 'E2E Tester',
        email: `${username}@example.com`
      })
    }).then(async r => {
      if (!r.ok) throw new Error(`Register failed: ${r.status}`);
      return r.json();
    });

    // 2) Login
    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(async r => {
      if (!r.ok) throw new Error(`Login failed: ${r.status}`);
      return r.json();
    });
    token = loginRes.token;
    if (!token) throw new Error('Failed to obtain JWT token');

    // 3) Create invoice WITHOUT payments first (some UIs do this)
    const dueDate = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
    const createRes = await fetch(`${API}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
      documentType: 'invoice',
      senderCompanyName: 'Syarikat Ujian',
      senderCompanyAddress: 'Alamat Ujian 123',
      senderCompanyEmail: 'syarikat@example.com',
      clientName: 'Pelanggan Ujian',
      clientEmail: 'pelanggan@example.com',
      clientAddress: 'Alamat Pelanggan 456',
      dueDate,
      items: [
        { description: 'Item A', quantity: 2, unitPrice: 50, amount: 100 },
        { description: 'Item B', quantity: 1, unitPrice: 25, amount: 25 }
      ],
      tax: 0,
      // no payments on initial create
      amountPaid: 0,
      notes: 'Nota awal',
      termsAndConditions: 'Terma Ujian'
    })
    }).then(async r => {
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(`Create invoice failed: ${r.status} ${JSON.stringify(body)}`);
      return body;
    });

    const created = createRes.invoice;
    invoiceId = created._id;
    if (!invoiceId) throw new Error('Invoice not created');

    // 4) Update WITH payments (add 2 payments)
    const firstPayments = [
      { amount: 50, date: dueDate, note: 'Deposit' },
      { amount: 25, date: dueDate, note: 'Ansuran 1' }
    ];
    await fetch(`${API}/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        documentType: 'invoice',
        senderCompanyName: 'Syarikat Ujian',
        senderCompanyAddress: 'Alamat Ujian 123',
        senderCompanyEmail: 'syarikat@example.com',
        clientName: 'Pelanggan Ujian',
        clientEmail: 'pelanggan@example.com',
        clientAddress: 'Alamat Pelanggan 456',
        dueDate,
        items: [
          { description: 'Item A', quantity: 2, unitPrice: 50 },
          { description: 'Item B', quantity: 1, unitPrice: 25 }
        ],
        tax: 0,
        payments: firstPayments
      })
    }).then(async r => { if (!r.ok) { const b = await r.json().catch(()=>({})); throw new Error(`Update-with-payments failed: ${r.status} ${JSON.stringify(b)}`);} });

    // 5) Fetch and assert payments length == 2
    const fetched1 = await fetch(`${API}/invoices/${invoiceId}`, { headers: authHeaders() })
      .then(async r => { if (!r.ok) throw new Error(`Fetch1 failed: ${r.status}`); return r.json(); });
    if (!Array.isArray(fetched1.payments) || fetched1.payments.length !== 2) {
      console.error('DEBUG fetched1:', JSON.stringify(fetched1, null, 2));
      throw new Error(`Expected 2 payments after create, got ${fetched1.payments?.length}`);
    }

    // 6) Update WITHOUT payments (change notes only)
    await fetch(`${API}/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
      documentType: fetched1.documentType,
      senderCompanyName: fetched1.senderCompanyName,
      senderCompanyAddress: fetched1.senderCompanyAddress,
      senderCompanyEmail: fetched1.senderCompanyEmail,
      clientName: fetched1.clientName,
      clientEmail: fetched1.clientEmail,
      clientAddress: fetched1.clientAddress,
      dueDate: fetched1.dueDate,
      items: fetched1.items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
      tax: fetched1.tax,
      notes: 'Nota dikemaskini tanpa hantar payments'
      // Intentionally do NOT send payments
    })
    }).then(async r => { if (!r.ok) { const b = await r.json().catch(()=>({})); throw new Error(`Update1 failed: ${r.status} ${JSON.stringify(b)}`);} });

    // 7) Fetch and assert payments still length == 2
    const fetched2 = await fetch(`${API}/invoices/${invoiceId}`, { headers: authHeaders() })
      .then(async r => { if (!r.ok) throw new Error(`Fetch2 failed: ${r.status}`); return r.json(); });
    if (!Array.isArray(fetched2.payments) || fetched2.payments.length !== 2) {
      throw new Error(`Payments lost after update-without-payments. Got ${fetched2.payments?.length}`);
    }

    // 8) Update WITH an extra payment
    const extraPayments = [...fetched2.payments.map(p => ({ amount: p.amount, date: p.date, note: p.note })), { amount: 10, date: dueDate, note: 'Ansuran 2' }];
    await fetch(`${API}/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
      documentType: fetched2.documentType,
      senderCompanyName: fetched2.senderCompanyName,
      senderCompanyAddress: fetched2.senderCompanyAddress,
      senderCompanyEmail: fetched2.senderCompanyEmail,
      clientName: fetched2.clientName,
      clientEmail: fetched2.clientEmail,
      clientAddress: fetched2.clientAddress,
      dueDate: fetched2.dueDate,
      items: fetched2.items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
      tax: fetched2.tax,
      payments: extraPayments
    })
    }).then(async r => { if (!r.ok) { const b = await r.json().catch(()=>({})); throw new Error(`Update2 failed: ${r.status} ${JSON.stringify(b)}`);} });

    // 9) Fetch and assert payments length == 3 and amountPaid equals sum
    const fetched3 = await fetch(`${API}/invoices/${invoiceId}`, { headers: authHeaders() })
      .then(async r => { if (!r.ok) throw new Error(`Fetch3 failed: ${r.status}`); return r.json(); });
    if (!Array.isArray(fetched3.payments) || fetched3.payments.length !== 3) {
      throw new Error(`Expected 3 payments after adding extra, got ${fetched3.payments?.length}`);
    }
    const sum = fetched3.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    if (Math.abs(sum - (parseFloat(fetched3.amountPaid) || 0)) > 1e-6) {
      throw new Error(`amountPaid mismatch: sum(payments)=${sum} vs amountPaid=${fetched3.amountPaid}`);
    }

    console.log('✅ E2E payments test passed. Payments persist across updates and amountPaid is consistent.');
    process.exit(0);
  } catch (err) {
    console.error('❌ E2E payments test failed:', err.response?.data || err.message || err);
    process.exit(1);
  }
}

run();
