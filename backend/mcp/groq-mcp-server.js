const { Groq } = require('groq-sdk');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

class GroqMCPServer {
  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY tidak ditemui dalam environment variables');
    }

    this.groq = new Groq({ apiKey });
    this.model = 'llama-3.1-8b-instant';
    // Initialize available tools once
    this.tools = this.getTools();
  }

  // Tools yang AI boleh guna
  getTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'createDocument',
          description: 'Create a new invoice or quote for a customer',
          parameters: {
            type: 'object',
            properties: {
              documentType: {
                type: 'string',
                enum: ['invoice', 'quote'],
                description: 'Type of document: "invoice" for invois or "quote" for sebut harga'
              },
              customer: {
                type: 'string',
                description: 'Customer name or company name'
              },
              items: {
                type: 'array',
                description: 'List of items for the document',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Item name or description'
                    },
                    quantity: {
                      type: 'number',
                      description: 'Quantity of the item'
                    },
                    price: {
                      type: 'number',
                      description: 'Price per unit'
                    }
                  },
                  required: ['name', 'quantity', 'price']
                }
              },
              dueDate: {
                type: 'string',
                description: 'Due date in days (e.g., "30 days") or specific date'
              },
              notes: {
                type: 'string',
                description: 'Additional notes for the document'
              }
            },
            required: ['documentType', 'customer', 'items']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getDocuments',
          description: 'Get invoices and quotes with optional filters',
          parameters: {
            type: 'object',
            properties: {
              documentType: {
                type: 'string',
                enum: ['invoice', 'quote', 'all'],
                description: 'Filter by document type: "invoice" for invois, "quote" for sebut harga, or "all" for both'
              },
              status: {
                type: 'string',
                description: 'Filter by status: draft, sent, paid, overdue'
              },
              customer: {
                type: 'string',
                description: 'Filter by customer name'
              },
              dateRange: {
                type: 'string',
                description: 'Filter by date range (e.g., "last month", "this year")'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getCustomers',
          description: 'Get all customers or search for specific customer',
          parameters: {
            type: 'object',
            properties: {
              search: {
                type: 'string',
                description: 'Search term for customer name or email'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getAnalytics',
          description: 'Get analytics and statistics',
          parameters: {
            type: 'object',
            properties: {
              timeframe: {
                type: 'string',
                description: 'Time period for analytics (e.g., "this month", "last quarter")'
              },
              type: {
                type: 'string',
                description: 'Type of analytics (revenue, invoices, customers)'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'findDocument',
          description: 'Find a specific document by document number',
          parameters: {
            type: 'object',
            properties: {
              documentNumber: {
                type: 'string',
                description: 'Document number to search for (e.g., "INV-202509-017", "QUO-202509-001")'
              }
            },
            required: ['documentNumber']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getQuoteTotal',
          description: 'Get total amount of a specific quote by document number',
          parameters: {
            type: 'object',
            properties: {
              documentNumber: {
                type: 'string',
                description: 'Quote document number (e.g., "QUO-202509-001")'
              }
            },
            required: ['documentNumber']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getRevenueAnalysis',
          description: 'Get detailed revenue analysis including paid, pending, and overdue amounts',
          parameters: {
            type: 'object',
            properties: {
              timeframe: {
                type: 'string',
                description: 'Time period for analysis (e.g., "this month", "last quarter", "this year")'
              },
              documentType: {
                type: 'string',
                enum: ['invoice', 'quote', 'all'],
                description: 'Type of documents to analyze'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getPaymentStatus',
          description: 'Get payment status breakdown (paid, pending, overdue)',
          parameters: {
            type: 'object',
            properties: {
              documentType: {
                type: 'string',
                enum: ['invoice', 'quote', 'all'],
                description: 'Type of documents to analyze'
              },
              timeframe: {
                type: 'string',
                description: 'Time period for analysis'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getCustomerAnalysis',
          description: 'Get customer analysis including top customers and their spending',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of top customers to return (default: 10)'
              },
              timeframe: {
                type: 'string',
                description: 'Time period for analysis'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getMonthlyReport',
          description: 'Get monthly business report with comprehensive statistics',
          parameters: {
            type: 'object',
            properties: {
              month: {
                type: 'string',
                description: 'Month to analyze (e.g., "2025-01", "January 2025")'
              },
              year: {
                type: 'string',
                description: 'Year to analyze (e.g., "2025")'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'deleteDocument',
          description: 'Delete a document (invoice or quote) by document number',
          parameters: {
            type: 'object',
            properties: {
              documentNumber: {
                type: 'string',
                description: 'Document number to delete (e.g., "INV-202509-001", "QUO-202509-001")'
              }
            },
            required: ['documentNumber']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'deleteCustomer',
          description: 'Delete a customer by name or email',
          parameters: {
            type: 'object',
            properties: {
              customerIdentifier: {
                type: 'string',
                description: 'Customer name or email to delete'
              }
            },
            required: ['customerIdentifier']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'createCustomer',
          description: 'Create a new customer',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Customer full name'
              },
              company: {
                type: 'string',
                description: 'Company name (optional)'
              },
              email: {
                type: 'string',
                description: 'Customer email address'
              },
              phone: {
                type: 'string',
                description: 'Customer phone number (optional)'
              },
              address: {
                type: 'string',
                description: 'Customer address (optional)'
              }
            },
            required: ['name', 'email']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getOutstandingAmounts',
          description: 'Get detailed outstanding amounts and balances for invoices and quotes',
          parameters: {
            type: 'object',
            properties: {
              documentType: {
                type: 'string',
                enum: ['invoice', 'quote', 'all'],
                description: 'Type of documents to analyze'
              },
              timeframe: {
                type: 'string',
                description: 'Time period for analysis (e.g., "this month", "last quarter")'
              },
              customer: {
                type: 'string',
                description: 'Filter by specific customer name'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getDetailedInvoiceAnalysis',
          description: 'Get comprehensive invoice analysis with breakdowns',
          parameters: {
            type: 'object',
            properties: {
              analysisType: {
                type: 'string',
                enum: ['summary', 'outstanding', 'overdue', 'recent', 'top_customers'],
                description: 'Type of analysis to perform'
              },
              timeframe: {
                type: 'string',
                description: 'Time period for analysis'
              },
              limit: {
                type: 'number',
                description: 'Number of results to return (default: 10)'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getQuoteAnalysis',
          description: 'Get comprehensive quote analysis and conversion rates',
          parameters: {
            type: 'object',
            properties: {
              analysisType: {
                type: 'string',
                enum: ['summary', 'conversion', 'pending', 'recent', 'top_customers'],
                description: 'Type of quote analysis to perform'
              },
              timeframe: {
                type: 'string',
                description: 'Time period for analysis'
              },
              limit: {
                type: 'number',
                description: 'Number of results to return (default: 10)'
              }
            }
          }
        }
      }
    ];
  }

  // Process user message dengan Groq
  async processMessage(message, context = {}) {
    try {
      const systemPrompt = `Anda adalah AI assistant untuk sistem pengurusan dokumen perniagaan. 
Anda boleh membantu pengguna dengan:
- Membuat Invois (invoice) atau Sebut Harga (quote) baru
- Mencari dokumen dan pelanggan
- Memberikan analisis dan statistik
- Menjawab soalan tentang sistem

PENTING: Kenalpasti jenis dokumen yang diminta:
- "Invois" atau "Invoice" = documentType: "invoice" (nombor dokumen: INV-xxx)
- "Sebut Harga" atau "Quote" = documentType: "quote" (nombor dokumen: QUO-xxx)

Contoh commands dan kemungkinan pertanyaan:

DOKUMEN:
- "Buat invois untuk Ahmad" → createDocument dengan documentType: "invoice"
- "Buat sebut harga untuk ABC Company" → createDocument dengan documentType: "quote"
- "Tunjukkan semua invois" → getDocuments dengan documentType: "invoice"
- "Tunjukkan sebut harga yang belum dibayar" → getDocuments dengan documentType: "quote" dan status: "sent"
- "Cari dokumen INV-202509-017" → findDocument dengan documentNumber: "INV-202509-017"
- "Berapa jumlah harga sebut harga QUO-202509-001" → getQuoteTotal dengan documentNumber: "QUO-202509-001"

REVENUE & PEMBAYARAN:
- "Berapa jumlah revenue yang dibayar sahaja?" → getRevenueAnalysis dengan documentType: "invoice"
- "Berapa revenue bulan ini?" → getRevenueAnalysis dengan timeframe: "this month"
- "Berapa revenue tahun ini?" → getRevenueAnalysis dengan timeframe: "this year"
- "Berapa revenue yang belum dibayar?" → getRevenueAnalysis (akan tunjukkan pending + overdue)
- "Berapa revenue yang overdue?" → getRevenueAnalysis (akan tunjukkan overdue sahaja)
- "Status pembayaran saya" → getPaymentStatus
- "Berapa invois yang belum dibayar?" → getPaymentStatus dengan documentType: "invoice"

JUMLAH TERTUNGGAK & BAKI:
- "Berapa jumlah tertunggak saya?" → getOutstandingAmounts
- "Berapa baki invois yang belum dibayar?" → getOutstandingAmounts dengan documentType: "invoice"
- "Berapa sebut harga yang pending?" → getOutstandingAmounts dengan documentType: "quote"
- "Jumlah tertunggak bulan ini" → getOutstandingAmounts dengan timeframe: "this month"
- "Baki tertunggak untuk pelanggan Ahmad" → getOutstandingAmounts dengan customer: "Ahmad"

ANALISIS INVOIS DETAIL:
- "Analisis invois saya" → getDetailedInvoiceAnalysis dengan analysisType: "summary"
- "Invois yang tertunggak" → getDetailedInvoiceAnalysis dengan analysisType: "outstanding"
- "Invois yang overdue" → getDetailedInvoiceAnalysis dengan analysisType: "overdue"
- "Invois terkini" → getDetailedInvoiceAnalysis dengan analysisType: "recent"
- "Top 5 pelanggan invois" → getDetailedInvoiceAnalysis dengan analysisType: "top_customers", limit: 5
- "Analisis invois bulan ini" → getDetailedInvoiceAnalysis dengan timeframe: "this month"

ANALISIS SEBUT HARGA DETAIL:
- "Analisis sebut harga saya" → getQuoteAnalysis dengan analysisType: "summary"
- "Sebut harga yang pending" → getQuoteAnalysis dengan analysisType: "pending"
- "Sebut harga terkini" → getQuoteAnalysis dengan analysisType: "recent"
- "Top 5 pelanggan sebut harga" → getQuoteAnalysis dengan analysisType: "top_customers", limit: 5
- "Analisis sebut harga bulan ini" → getQuoteAnalysis dengan timeframe: "this month"

PELANGGAN:
- "Siapa pelanggan terbaik saya?" → getCustomerAnalysis
- "Top 5 pelanggan saya" → getCustomerAnalysis dengan limit: 5
- "Berapa banyak pelanggan saya?" → getCustomerAnalysis
- "Cari pelanggan Ahmad" → getCustomers dengan search: "Ahmad"
- "Tambah pelanggan baru Ahmad Sdn Bhd" → createCustomer dengan name: "Ahmad Sdn Bhd", email: "ahmad@example.com"
- "Tambah pelanggan John Doe dengan email john@company.com" → createCustomer dengan name: "John Doe", email: "john@company.com"
- "Daftar pelanggan ABC Company" → createCustomer dengan name: "ABC Company", email: "info@abccompany.com"

LAPORAN & ANALISIS:
- "Laporan bulan ini" → getMonthlyReport
- "Laporan Januari 2025" → getMonthlyReport dengan month: "January 2025", year: "2025"
- "Analisis revenue bulan lepas" → getRevenueAnalysis dengan timeframe: "last month"
- "Berapa invois saya bulan ini?" → getMonthlyReport
- "Berapa sebut harga saya bulan ini?" → getMonthlyReport

STATISTIK UMUM:
- "Berapa jumlah jualan saya?" → getAnalytics
- "Statistik perniagaan saya" → getAnalytics
- "Berapa banyak dokumen saya?" → getAnalytics

PADAM DATA:
- "Padam dokumen INV-202509-017" → deleteDocument dengan documentNumber: "INV-202509-017"
- "Padam sebut harga QUO-202509-001" → deleteDocument dengan documentNumber: "QUO-202509-001"
- "Padam pelanggan Ahmad" → deleteCustomer dengan customerIdentifier: "Ahmad"
- "Padam pelanggan ahmad@email.com" → deleteCustomer dengan customerIdentifier: "ahmad@email.com"

PENTING UNTUK DELETE:
- Selalu konfirmasi sebelum memadam data
- Untuk pelanggan, pastikan tiada dokumen yang berkaitan
- Berikan amaran jika ada dokumen yang berkaitan dengan pelanggan

TAMBAH PELANGGAN:
- "Tambah pelanggan baru" → createCustomer (AI akan tanya maklumat yang diperlukan)
- "Daftar pelanggan [nama] dengan email [email]" → createCustomer dengan name dan email
- "Tambah pelanggan [nama] dari syarikat [company]" → createCustomer dengan name, company, dan email
- "Buat profil pelanggan baru" → createCustomer (AI akan guide user)

PENTING UNTUK CREATE CUSTOMER:
- Email adalah required field
- Nama adalah required field
- Company, phone, address adalah optional
- Check duplicate email sebelum create
- Berikan feedback yang jelas selepas create

Selalu jawab dalam bahasa Melayu dan berikan respons yang membantu dan profesional.

Context: ${JSON.stringify(context)}`;

      const response = await this.groq.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        tools: this.tools,
        tool_choice: 'auto'
      });

      return response;
   } catch (error) {
  console.error('Groq API Error:', error);
  console.error('Error details:', {
    message: error.message,
    status: error.status,
    code: error.code
  });
  throw new Error(`Gagal memproses permintaan AI: ${error.message}`);
}
  }

  // Handle tool calls
  async handleToolCalls(toolCalls, context = {}) {
    const results = [];
    
    for (const toolCall of toolCalls) {
      const { name, arguments: args } = toolCall.function;
      const parsedArgs = JSON.parse(args);
      
      try {
        let result;
        
        switch (name) {
          case 'createDocument':
            result = await this.createDocument(parsedArgs, context);
            const docType = parsedArgs.documentType === 'quote' ? 'Sebut Harga' : 'Invois';
            results.push(`✅ ${docType} #${result.documentNumber} telah dibuat untuk ${parsedArgs.customer}!`);
            break;
            
          case 'getDocuments':
            result = await this.getDocuments(parsedArgs, context);
            const docTypeFilter = parsedArgs.documentType || 'all';
            if (docTypeFilter === 'all') {
              results.push(`📄 Ditemui ${result.length} dokumen (Invois & Sebut Harga).`);
            } else {
              const typeName = docTypeFilter === 'quote' ? 'Sebut Harga' : 'Invois';
              results.push(`📄 Ditemui ${result.length} ${typeName}.`);
            }
            break;
            
          case 'getCustomers':
            result = await this.getCustomers(parsedArgs, context);
            results.push(`👥 Ditemui ${result.length} pelanggan.`);
            break;
            
          case 'getAnalytics':
            result = await this.getAnalytics(parsedArgs, context);
            results.push(`📊 Analisis: ${result.summary}`);
            break;
            
          case 'findDocument':
            result = await this.findDocument(parsedArgs, context);
            if (result) {
              const docType = result.documentType === 'quote' ? 'Sebut Harga' : 'Invois';
              results.push(`📄 ${docType} #${result.documentNumber} ditemui untuk ${result.customer} - RM${result.total} (Status: ${result.status})`);
            } else {
              results.push(`❌ Dokumen #${parsedArgs.documentNumber} tidak ditemui.`);
            }
            break;
            
          case 'getQuoteTotal':
            result = await this.getQuoteTotal(parsedArgs, context);
            if (result) {
              results.push(`💰 Jumlah harga Sebut Harga #${result.documentNumber}: RM${result.total.toLocaleString()} untuk ${result.customer}`);
            } else {
              results.push(`❌ Sebut Harga #${parsedArgs.documentNumber} tidak ditemui.`);
            }
            break;
            
          case 'getRevenueAnalysis':
            result = await this.getRevenueAnalysis(parsedArgs, context);
            results.push(`📊 Analisis Revenue: ${result.summary}`);
            break;
            
          case 'getPaymentStatus':
            result = await this.getPaymentStatus(parsedArgs, context);
            results.push(`💳 Status Pembayaran: ${result.summary}`);
            break;
            
          case 'getCustomerAnalysis':
            result = await this.getCustomerAnalysis(parsedArgs, context);
            results.push(`👥 Analisis Pelanggan: ${result.summary}`);
            break;
            
          case 'getMonthlyReport':
            result = await this.getMonthlyReport(parsedArgs, context);
            results.push(`📈 Laporan Bulanan: ${result.summary}`);
            break;
            
          case 'deleteDocument':
            result = await this.deleteDocument(parsedArgs, context);
            if (result.success) {
              results.push(`🗑️ Dokumen #${result.documentNumber} (${result.documentType}) berjaya dipadam.`);
            } else {
              results.push(`❌ Gagal memadam dokumen #${parsedArgs.documentNumber}: ${result.error}`);
            }
            break;
            
          case 'deleteCustomer':
            result = await this.deleteCustomer(parsedArgs, context);
            if (result.success) {
              results.push(`🗑️ Pelanggan "${result.customerName}" berjaya dipadam.`);
            } else {
              results.push(`❌ Gagal memadam pelanggan "${parsedArgs.customerIdentifier}": ${result.error}`);
            }
            break;
            
          case 'createCustomer':
            result = await this.createCustomer(parsedArgs, context);
            if (result.success) {
              results.push(`✅ Pelanggan "${result.customerName}" berjaya ditambah! Email: ${result.customerEmail}`);
            } else {
              results.push(`❌ Gagal menambah pelanggan: ${result.error}`);
            }
            break;
            
          case 'getOutstandingAmounts':
            result = await this.getOutstandingAmounts(parsedArgs, context);
            results.push(`💰 Analisis Jumlah Tertunggak: ${result.summary}`);
            break;
            
          case 'getDetailedInvoiceAnalysis':
            result = await this.getDetailedInvoiceAnalysis(parsedArgs, context);
            results.push(`📊 Analisis Invois Detail: ${result.summary}`);
            break;
            
          case 'getQuoteAnalysis':
            result = await this.getQuoteAnalysis(parsedArgs, context);
            results.push(`📋 Analisis Sebut Harga: ${result.summary}`);
            break;
            
          default:
            results.push(`❌ Fungsi ${name} tidak dikenali.`);
        }
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        results.push(`❌ Ralat semasa menjalankan ${name}: ${error.message}`);
      }
    }
    
    return results.join('\n');
  }

  // Tool implementations
  async createDocument(data, context) {
    try {
      // Find or create customer
      let customer = await Customer.findOne({
        userId: context.userId,
        $or: [
          { name: { $regex: data.customer, $options: 'i' } },
          { company: { $regex: data.customer, $options: 'i' } }
        ]
      });

      if (!customer) {
        // Create new customer if not found
        customer = new Customer({
          userId: context.userId,
          name: data.customer,
          email: `${data.customer.toLowerCase().replace(/\s+/g, '')}@example.com`,
          company: data.customer,
          status: 'active'
        });
        await customer.save();
      }

      // Calculate due date
      let dueDate = new Date();
      if (data.dueDate && data.dueDate.includes('days')) {
        const days = parseInt(data.dueDate.match(/\d+/)[0]);
        dueDate.setDate(dueDate.getDate() + days);
      } else if (data.dueDate) {
        const parsedDate = new Date(data.dueDate);
        if (!isNaN(parsedDate.getTime())) {
          dueDate = parsedDate;
        } else {
          dueDate.setDate(dueDate.getDate() + 30); // Default 30 days if invalid
        }
      } else {
        dueDate.setDate(dueDate.getDate() + 30); // Default 30 days
      }

      // Convert items to invoice format
      const invoiceItems = data.items.map(item => ({
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        amount: item.quantity * item.price
      }));

      const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);

      // Create document (invoice or quote)
      const document = new Invoice({
        userId: context.userId,
        documentType: data.documentType, // 'invoice' or 'quote'
        senderCompanyName: 'Your Company Name', // This should come from user profile
        senderCompanyAddress: 'Your Company Address',
        senderCompanyEmail: 'your@company.com',
        clientName: customer.name,
        clientCompany: customer.company || customer.name,
        clientEmail: customer.email,
        clientAddress: customer.fullAddress || 'Address not provided',
        clientPhone: customer.phone || '',
        issueDate: new Date(),
        dueDate: dueDate,
        items: invoiceItems,
        subtotal: subtotal,
        total: subtotal,
        status: 'draft',
        notes: data.notes || '',
        currency: 'RM'
      });

      await document.save();

      return {
        id: document._id,
        documentNumber: document.invoiceNumber, // This will be INV-xxx or QUO-xxx
        documentType: document.documentType,
        customer: customer.name,
        total: document.total,
        status: document.status,
        dueDate: document.dueDate,
        createdAt: document.createdAt
      };

    } catch (error) {
      console.error('Error creating document:', error);
      const docType = data.documentType === 'quote' ? 'sebut harga' : 'invois';
      throw new Error(`Gagal membuat ${docType}: ${error.message}`);
    }
  }

  async getDocuments(filters, context) {
    try {
      // Build query
      const query = { userId: context.userId };
      
      // Add document type filter
      if (filters && filters.documentType && filters.documentType !== 'all') {
        query.documentType = filters.documentType;
      }
      
      // Add status filter
      if (filters && filters.status) {
        query.status = filters.status;
      }
      
      // Add customer filter
      if (filters && filters.customer) {
        query.$or = [
          { clientName: { $regex: filters.customer, $options: 'i' } },
          { clientCompany: { $regex: filters.customer, $options: 'i' } }
        ];
      }

      // Get documents from database
      const documents = await Invoice.find(query)
        .sort({ createdAt: -1 })
        .limit(50) // Limit to 50 most recent documents
        .lean();

      // Format documents for response
      const formattedDocuments = documents.map(doc => ({
        id: doc._id,
        documentNumber: doc.invoiceNumber, // INV-xxx or QUO-xxx
        documentType: doc.documentType,
        documentTypeName: doc.documentType === 'quote' ? 'Sebut Harga' : 'Invois',
        customer: doc.clientName,
        company: doc.clientCompany,
        total: doc.total,
        status: doc.status,
        dueDate: doc.dueDate,
        issueDate: doc.issueDate,
        createdAt: doc.createdAt,
        items: doc.items.length,
        currency: doc.currency
      }));

      return formattedDocuments;

    } catch (error) {
      console.error('Error getting documents:', error);
      throw new Error(`Gagal mendapatkan dokumen: ${error.message}`);
    }
  }

  async getCustomers(filters, context) {
    try {
      // Build query
      const query = { userId: context.userId, status: 'active' };
      
      // Add search filter
      if (filters && filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { company: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } }
        ];
      }

      // Get customers from database
      const customers = await Customer.find(query)
        .sort({ name: 1 })
        .limit(50) // Limit to 50 customers
        .lean();

      // Format customers for response
      const formattedCustomers = customers.map(customer => ({
        id: customer._id,
        name: customer.name,
        company: customer.company,
        email: customer.email,
        phone: customer.phone,
        fullAddress: customer.fullAddress,
        totalInvoices: customer.totalInvoices || 0,
        totalAmount: customer.totalAmount || 0,
        lastInvoiceDate: customer.lastInvoiceDate,
        createdAt: customer.createdAt
      }));

      return formattedCustomers;

    } catch (error) {
      console.error('Error getting customers:', error);
      throw new Error(`Gagal mendapatkan pelanggan: ${error.message}`);
    }
  }

  async getAnalytics(filters, context) {
    try {
      const userId = context.userId;
      
      // Get basic counts
      const totalInvoices = await Invoice.countDocuments({ userId });
      const totalCustomers = await Customer.countDocuments({ userId, status: 'active' });
      
      // Get revenue data
      const revenueData = await Invoice.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            paidRevenue: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] 
              } 
            },
            pendingRevenue: { 
              $sum: { 
                $cond: [{ $in: ['$status', ['sent', 'draft']] }, '$total', 0] 
              } 
            }
          }
        }
      ]);

      // Get status breakdown
      const statusBreakdown = await Invoice.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$total' }
          }
        }
      ]);

      // Get top customer
      const topCustomer = await Invoice.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$clientName',
            totalAmount: { $sum: '$total' },
            invoiceCount: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 1 }
      ]);

      const revenue = revenueData[0] || { totalRevenue: 0, paidRevenue: 0, pendingRevenue: 0 };
      const topCustomerData = topCustomer[0] || { _id: 'Tiada data', totalAmount: 0 };

      const analytics = {
        totalInvoices,
        totalCustomers,
        totalRevenue: revenue.totalRevenue,
        paidRevenue: revenue.paidRevenue,
        pendingRevenue: revenue.pendingRevenue,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = { count: item.count, total: item.total };
          return acc;
        }, {}),
        topCustomer: topCustomerData._id,
        topCustomerAmount: topCustomerData.totalAmount,
        summary: `Total ${(filters && filters.type) || 'revenue'}: RM${revenue.totalRevenue.toLocaleString()} (${totalInvoices} invois, ${totalCustomers} pelanggan)`
      };
      
      return analytics;

    } catch (error) {
      console.error('Error getting analytics:', error);
      throw new Error(`Gagal mendapatkan analisis: ${error.message}`);
    }
  }

  async findDocument(data, context) {
    try {
      const { documentNumber } = data;
      
      // Find document by invoice number
      const document = await Invoice.findOne({
        userId: context.userId,
        invoiceNumber: documentNumber
      }).lean();

      if (!document) {
        return null;
      }

      // Format document for response
      return {
        id: document._id,
        documentNumber: document.invoiceNumber,
        documentType: document.documentType,
        documentTypeName: document.documentType === 'quote' ? 'Sebut Harga' : 'Invois',
        customer: document.clientName,
        company: document.clientCompany,
        email: document.clientEmail,
        phone: document.clientPhone,
        address: document.clientAddress,
        total: document.total,
        subtotal: document.subtotal,
        status: document.status,
        dueDate: document.dueDate,
        issueDate: document.issueDate,
        createdAt: document.createdAt,
        items: document.items,
        notes: document.notes,
        currency: document.currency
      };

    } catch (error) {
      console.error('Error finding document:', error);
      throw new Error(`Gagal mencari dokumen: ${error.message}`);
    }
  }

  async getQuoteTotal(data, context) {
    try {
      const { documentNumber } = data;
      
      // Find quote by document number
      const quote = await Invoice.findOne({
        userId: context.userId,
        invoiceNumber: documentNumber,
        documentType: 'quote'
      }).lean();

      if (!quote) {
        return null;
      }

      // Return quote total information
      return {
        documentNumber: quote.invoiceNumber,
        customer: quote.clientName,
        total: quote.total,
        subtotal: quote.subtotal,
        currency: quote.currency,
        status: quote.status,
        dueDate: quote.dueDate,
        issueDate: quote.issueDate,
        items: quote.items.length
      };

    } catch (error) {
      console.error('Error getting quote total:', error);
      throw new Error(`Gagal mendapatkan jumlah sebut harga: ${error.message}`);
    }
  }

  async getRevenueAnalysis(filters, context) {
    try {
      const userId = context.userId;
      
      // Build match query
      const matchQuery = { userId: new mongoose.Types.ObjectId(userId) };
      
      // Add document type filter
      if (filters && filters.documentType && filters.documentType !== 'all') {
        matchQuery.documentType = filters.documentType;
      }
      
      // Add date filter based on timeframe
      if (filters && filters.timeframe) {
        const now = new Date();
        let startDate;
        
        switch (filters.timeframe.toLowerCase()) {
          case 'this month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'last month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            break;
          case 'this year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          case 'last quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3 - 3, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Default to this month
        }
        
        matchQuery.createdAt = { $gte: startDate };
      }

      // Get detailed revenue analysis
      const revenueData = await Invoice.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            paidRevenue: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] 
              } 
            },
            pendingRevenue: { 
              $sum: { 
                $cond: [{ $in: ['$status', ['sent', 'draft']] }, '$total', 0] 
              } 
            },
            overdueRevenue: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'overdue'] }, '$total', 0] 
              } 
            },
            totalDocuments: { $sum: 1 },
            paidDocuments: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] 
              } 
            },
            pendingDocuments: { 
              $sum: { 
                $cond: [{ $in: ['$status', ['sent', 'draft']] }, 1, 0] 
              } 
            },
            overdueDocuments: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] 
              } 
            }
          }
        }
      ]);

      const revenue = revenueData[0] || {
        totalRevenue: 0, paidRevenue: 0, pendingRevenue: 0, overdueRevenue: 0,
        totalDocuments: 0, paidDocuments: 0, pendingDocuments: 0, overdueDocuments: 0
      };

      const paidPercentage = revenue.totalRevenue > 0 ? 
        ((revenue.paidRevenue / revenue.totalRevenue) * 100).toFixed(1) : 0;

      return {
        totalRevenue: revenue.totalRevenue,
        paidRevenue: revenue.paidRevenue,
        pendingRevenue: revenue.pendingRevenue,
        overdueRevenue: revenue.overdueRevenue,
        totalDocuments: revenue.totalDocuments,
        paidDocuments: revenue.paidDocuments,
        pendingDocuments: revenue.pendingDocuments,
        overdueDocuments: revenue.overdueDocuments,
        paidPercentage: paidPercentage,
        summary: `Total Revenue: RM${revenue.totalRevenue.toLocaleString()} | Dibayar: RM${revenue.paidRevenue.toLocaleString()} (${paidPercentage}%) | Belum Bayar: RM${revenue.pendingRevenue.toLocaleString()} | Overdue: RM${revenue.overdueRevenue.toLocaleString()}`
      };

    } catch (error) {
      console.error('Error getting revenue analysis:', error);
      throw new Error(`Gagal mendapatkan analisis revenue: ${error.message}`);
    }
  }

  async getPaymentStatus(filters, context) {
    try {
      const userId = context.userId;
      
      // Build match query
      const matchQuery = { userId: new mongoose.Types.ObjectId(userId) };
      
      if (filters && filters.documentType && filters.documentType !== 'all') {
        matchQuery.documentType = filters.documentType;
      }

      // Get payment status breakdown
      const statusData = await Invoice.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$total' },
            avgAmount: { $avg: '$total' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]);

      const statusBreakdown = statusData.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          totalAmount: item.totalAmount,
          avgAmount: item.avgAmount
        };
        return acc;
      }, {});

      const totalDocs = statusData.reduce((sum, item) => sum + item.count, 0);
      const totalAmount = statusData.reduce((sum, item) => sum + item.totalAmount, 0);

      return {
        statusBreakdown,
        totalDocuments: totalDocs,
        totalAmount,
        summary: `Status Pembayaran: ${totalDocs} dokumen (RM${totalAmount.toLocaleString()}) - Paid: ${statusBreakdown.paid?.count || 0}, Pending: ${statusBreakdown.sent?.count || 0}, Draft: ${statusBreakdown.draft?.count || 0}, Overdue: ${statusBreakdown.overdue?.count || 0}`
      };

    } catch (error) {
      console.error('Error getting payment status:', error);
      throw new Error(`Gagal mendapatkan status pembayaran: ${error.message}`);
    }
  }

  async getCustomerAnalysis(filters, context) {
    try {
      const userId = context.userId;
      const limit = filters && filters.limit ? filters.limit : 10;

      // Get top customers by total amount
      const topCustomers = await Invoice.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$clientName',
            totalAmount: { $sum: '$total' },
            invoiceCount: { $sum: 1 },
            avgAmount: { $avg: '$total' },
            lastInvoiceDate: { $max: '$createdAt' }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: limit }
      ]);

      // Get customer statistics
      const customerStats = await Invoice.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalCustomers: { $addToSet: '$clientName' },
            totalRevenue: { $sum: '$total' },
            avgOrderValue: { $avg: '$total' }
          }
        }
      ]);

      const stats = customerStats[0] || { totalCustomers: [], totalRevenue: 0, avgOrderValue: 0 };
      const uniqueCustomers = stats.totalCustomers.length;

      return {
        topCustomers,
        totalCustomers: uniqueCustomers,
        totalRevenue: stats.totalRevenue,
        avgOrderValue: stats.avgOrderValue,
        summary: `Top ${limit} Pelanggan: ${topCustomers.map(c => `${c._id} (RM${c.totalAmount.toLocaleString()})`).join(', ')} | Total: ${uniqueCustomers} pelanggan, RM${stats.totalRevenue.toLocaleString()}`
      };

    } catch (error) {
      console.error('Error getting customer analysis:', error);
      throw new Error(`Gagal mendapatkan analisis pelanggan: ${error.message}`);
    }
  }

  async getMonthlyReport(filters, context) {
    try {
      const userId = context.userId;
      const now = new Date();
      
      // Parse month and year
      let targetMonth, targetYear;
      if (filters && filters.month && filters.year) {
        targetYear = parseInt(filters.year);
        if (filters.month.includes('-')) {
          targetMonth = parseInt(filters.month.split('-')[1]) - 1; // 0-based month
        } else {
          targetMonth = new Date(`${filters.month} 1, ${targetYear}`).getMonth();
        }
      } else {
        targetYear = now.getFullYear();
        targetMonth = now.getMonth();
      }

      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

      // Get monthly statistics
      const monthlyData = await Invoice.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalInvoices: { $sum: { $cond: [{ $eq: ['$documentType', 'invoice'] }, 1, 0] } },
            totalQuotes: { $sum: { $cond: [{ $eq: ['$documentType', 'quote'] }, 1, 0] } },
            paidAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] } },
            pendingAmount: { $sum: { $cond: [{ $in: ['$status', ['sent', 'draft']] }, '$total', 0] } },
            overdueAmount: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, '$total', 0] } },
            uniqueCustomers: { $addToSet: '$clientName' }
          }
        }
      ]);

      const data = monthlyData[0] || {
        totalRevenue: 0, totalInvoices: 0, totalQuotes: 0,
        paidAmount: 0, pendingAmount: 0, overdueAmount: 0,
        uniqueCustomers: []
      };

      const monthName = new Date(targetYear, targetMonth).toLocaleString('ms-MY', { month: 'long' });
      const paidPercentage = data.totalRevenue > 0 ? 
        ((data.paidAmount / data.totalRevenue) * 100).toFixed(1) : 0;

      return {
        month: monthName,
        year: targetYear,
        totalRevenue: data.totalRevenue,
        totalInvoices: data.totalInvoices,
        totalQuotes: data.totalQuotes,
        paidAmount: data.paidAmount,
        pendingAmount: data.pendingAmount,
        overdueAmount: data.overdueAmount,
        uniqueCustomers: data.uniqueCustomers.length,
        paidPercentage,
        summary: `Laporan ${monthName} ${targetYear}: Revenue RM${data.totalRevenue.toLocaleString()} (${data.totalInvoices} invois, ${data.totalQuotes} quotes) | Dibayar: RM${data.paidAmount.toLocaleString()} (${paidPercentage}%) | ${data.uniqueCustomers.length} pelanggan`
      };

    } catch (error) {
      console.error('Error getting monthly report:', error);
      throw new Error(`Gagal mendapatkan laporan bulanan: ${error.message}`);
    }
  }

  async deleteDocument(filters, context) {
    try {
      const userId = context.userId;
      const documentNumber = filters.documentNumber;

      // Find the document first using invoiceNumber field
      const document = await Invoice.findOne({
        invoiceNumber: documentNumber,
        userId: new mongoose.Types.ObjectId(userId)
      });

      if (!document) {
        return {
          success: false,
          error: `Dokumen #${documentNumber} tidak ditemui.`
        };
      }

      // Delete the document
      await Invoice.deleteOne({
        _id: document._id,
        userId: new mongoose.Types.ObjectId(userId)
      });

      return {
        success: true,
        documentNumber: document.invoiceNumber,
        documentType: document.documentType,
        customerName: document.clientName,
        totalAmount: document.total
      };

    } catch (error) {
      console.error('Error deleting document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteCustomer(filters, context) {
    try {
      const userId = context.userId;
      const customerIdentifier = filters.customerIdentifier;

      // Find customer by name or email
      const customer = await Customer.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        $or: [
          { name: { $regex: customerIdentifier, $options: 'i' } },
          { email: { $regex: customerIdentifier, $options: 'i' } }
        ]
      });

      if (!customer) {
        return {
          success: false,
          error: `Pelanggan "${customerIdentifier}" tidak ditemui.`
        };
      }

      // Check if customer has any invoices or quotes
      const documentCount = await Invoice.countDocuments({
        clientName: customer.name,
        userId: new mongoose.Types.ObjectId(userId)
      });

      if (documentCount > 0) {
        return {
          success: false,
          error: `Tidak boleh memadam pelanggan "${customer.name}" kerana masih ada ${documentCount} dokumen yang berkaitan. Sila padam dokumen terlebih dahulu.`
        };
      }

      // Delete the customer
      await Customer.deleteOne({
        _id: customer._id,
        userId: new mongoose.Types.ObjectId(userId)
      });

      return {
        success: true,
        customerName: customer.name,
        customerEmail: customer.email
      };

    } catch (error) {
      console.error('Error deleting customer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createCustomer(data, context) {
    try {
      const userId = context.userId;

      // Check if customer already exists with same email
      const existingCustomer = await Customer.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        email: data.email
      });

      if (existingCustomer) {
        return {
          success: false,
          error: `Pelanggan dengan email "${data.email}" sudah wujud.`
        };
      }

      // Create new customer
      const customer = new Customer({
        userId: new mongoose.Types.ObjectId(userId),
        name: data.name,
        company: data.company || '',
        email: data.email,
        phone: data.phone || '',
        fullAddress: data.address || '',
        status: 'active'
      });

      await customer.save();

      return {
        success: true,
        customerId: customer._id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerCompany: customer.company,
        customerPhone: customer.phone,
        customerAddress: customer.fullAddress
      };

    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getOutstandingAmounts(filters, context) {
    try {
      const userId = context.userId;
      
      // Build match query
      const matchQuery = { userId: new mongoose.Types.ObjectId(userId) };
      
      // Add document type filter
      if (filters && filters.documentType && filters.documentType !== 'all') {
        matchQuery.documentType = filters.documentType;
      }
      
      // Add customer filter
      if (filters && filters.customer) {
        matchQuery.$or = [
          { clientName: { $regex: filters.customer, $options: 'i' } },
          { clientCompany: { $regex: filters.customer, $options: 'i' } }
        ];
      }
      
      // Add date filter based on timeframe
      if (filters && filters.timeframe) {
        const now = new Date();
        let startDate;
        
        switch (filters.timeframe.toLowerCase()) {
          case 'this month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'last month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            break;
          case 'this year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          case 'last quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3 - 3, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        matchQuery.createdAt = { $gte: startDate };
      }

      // Get outstanding amounts analysis
      const outstandingData = await Invoice.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalOutstanding: { 
              $sum: { 
                $cond: [{ $in: ['$status', ['sent', 'draft', 'overdue']] }, '$total', 0] 
              } 
            },
            totalOverdue: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'overdue'] }, '$total', 0] 
              } 
            },
            totalPending: { 
              $sum: { 
                $cond: [{ $in: ['$status', ['sent', 'draft']] }, '$total', 0] 
              } 
            },
            totalPaid: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] 
              } 
            },
            totalDocuments: { $sum: 1 },
            outstandingCount: { 
              $sum: { 
                $cond: [{ $in: ['$status', ['sent', 'draft', 'overdue']] }, 1, 0] 
              } 
            },
            overdueCount: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] 
              } 
            },
            pendingCount: { 
              $sum: { 
                $cond: [{ $in: ['$status', ['sent', 'draft']] }, 1, 0] 
              } 
            },
            paidCount: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] 
              } 
            }
          }
        }
      ]);

      const data = outstandingData[0] || {
        totalOutstanding: 0, totalOverdue: 0, totalPending: 0, totalPaid: 0,
        totalDocuments: 0, outstandingCount: 0, overdueCount: 0, pendingCount: 0, paidCount: 0
      };

      const docType = filters && filters.documentType ? 
        (filters.documentType === 'invoice' ? 'Invois' : 
         filters.documentType === 'quote' ? 'Sebut Harga' : 'Dokumen') : 'Dokumen';

      return {
        totalOutstanding: data.totalOutstanding,
        totalOverdue: data.totalOverdue,
        totalPending: data.totalPending,
        totalPaid: data.totalPaid,
        totalDocuments: data.totalDocuments,
        outstandingCount: data.outstandingCount,
        overdueCount: data.overdueCount,
        pendingCount: data.pendingCount,
        paidCount: data.paidCount,
        summary: `${docType} Tertunggak: RM${data.totalOutstanding.toLocaleString()} (${data.outstandingCount} dokumen) | Overdue: RM${data.totalOverdue.toLocaleString()} (${data.overdueCount} dokumen) | Pending: RM${data.totalPending.toLocaleString()} (${data.pendingCount} dokumen) | Dibayar: RM${data.totalPaid.toLocaleString()} (${data.paidCount} dokumen)`
      };

    } catch (error) {
      console.error('Error getting outstanding amounts:', error);
      throw new Error(`Gagal mendapatkan analisis jumlah tertunggak: ${error.message}`);
    }
  }

  async getDetailedInvoiceAnalysis(filters, context) {
    try {
      const userId = context.userId;
      const analysisType = filters && filters.analysisType ? filters.analysisType : 'summary';
      const limit = filters && filters.limit ? filters.limit : 10;

      // Build match query
      const matchQuery = { 
        userId: new mongoose.Types.ObjectId(userId),
        documentType: 'invoice'
      };

      // Add date filter based on timeframe
      if (filters && filters.timeframe) {
        const now = new Date();
        let startDate;
        
        switch (filters.timeframe.toLowerCase()) {
          case 'this month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'last month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            break;
          case 'this year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        matchQuery.createdAt = { $gte: startDate };
      }

      let result;

      switch (analysisType) {
        case 'outstanding':
          result = await this.getOutstandingInvoices(matchQuery, limit);
          break;
        case 'overdue':
          result = await this.getOverdueInvoices(matchQuery, limit);
          break;
        case 'recent':
          result = await this.getRecentInvoices(matchQuery, limit);
          break;
        case 'top_customers':
          result = await this.getTopInvoiceCustomers(matchQuery, limit);
          break;
        default: // summary
          result = await this.getInvoiceSummary(matchQuery);
      }

      return result;

    } catch (error) {
      console.error('Error getting detailed invoice analysis:', error);
      throw new Error(`Gagal mendapatkan analisis invois detail: ${error.message}`);
    }
  }

  async getQuoteAnalysis(filters, context) {
    try {
      const userId = context.userId;
      const analysisType = filters && filters.analysisType ? filters.analysisType : 'summary';
      const limit = filters && filters.limit ? filters.limit : 10;

      // Build match query
      const matchQuery = { 
        userId: new mongoose.Types.ObjectId(userId),
        documentType: 'quote'
      };

      // Add date filter based on timeframe
      if (filters && filters.timeframe) {
        const now = new Date();
        let startDate;
        
        switch (filters.timeframe.toLowerCase()) {
          case 'this month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'last month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            break;
          case 'this year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        matchQuery.createdAt = { $gte: startDate };
      }

      let result;

      switch (analysisType) {
        case 'conversion':
          result = await this.getQuoteConversionAnalysis(matchQuery);
          break;
        case 'pending':
          result = await this.getPendingQuotes(matchQuery, limit);
          break;
        case 'recent':
          result = await this.getRecentQuotes(matchQuery, limit);
          break;
        case 'top_customers':
          result = await this.getTopQuoteCustomers(matchQuery, limit);
          break;
        default: // summary
          result = await this.getQuoteSummary(matchQuery);
      }

      return result;

    } catch (error) {
      console.error('Error getting quote analysis:', error);
      throw new Error(`Gagal mendapatkan analisis sebut harga: ${error.message}`);
    }
  }

  // Helper methods for detailed analysis
  async getOutstandingInvoices(matchQuery, limit) {
    const outstanding = await Invoice.find({
      ...matchQuery,
      status: { $in: ['sent', 'draft', 'overdue'] }
    })
    .sort({ total: -1 })
    .limit(limit)
    .lean();

    const totalAmount = outstanding.reduce((sum, inv) => sum + inv.total, 0);

    return {
      type: 'outstanding',
      invoices: outstanding.map(inv => ({
        documentNumber: inv.invoiceNumber,
        customer: inv.clientName,
        amount: inv.total,
        status: inv.status,
        dueDate: inv.dueDate
      })),
      totalAmount,
      count: outstanding.length,
      summary: `Invois Tertunggak: ${outstanding.length} dokumen, Jumlah: RM${totalAmount.toLocaleString()}`
    };
  }

  async getOverdueInvoices(matchQuery, limit) {
    const overdue = await Invoice.find({
      ...matchQuery,
      status: 'overdue'
    })
    .sort({ dueDate: 1 })
    .limit(limit)
    .lean();

    const totalAmount = overdue.reduce((sum, inv) => sum + inv.total, 0);

    return {
      type: 'overdue',
      invoices: overdue.map(inv => ({
        documentNumber: inv.invoiceNumber,
        customer: inv.clientName,
        amount: inv.total,
        dueDate: inv.dueDate,
        daysOverdue: Math.ceil((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))
      })),
      totalAmount,
      count: overdue.length,
      summary: `Invois Overdue: ${overdue.length} dokumen, Jumlah: RM${totalAmount.toLocaleString()}`
    };
  }

  async getRecentInvoices(matchQuery, limit) {
    const recent = await Invoice.find(matchQuery)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    const totalAmount = recent.reduce((sum, inv) => sum + inv.total, 0);

    return {
      type: 'recent',
      invoices: recent.map(inv => ({
        documentNumber: inv.invoiceNumber,
        customer: inv.clientName,
        amount: inv.total,
        status: inv.status,
        createdAt: inv.createdAt
      })),
      totalAmount,
      count: recent.length,
      summary: `Invois Terkini: ${recent.length} dokumen, Jumlah: RM${totalAmount.toLocaleString()}`
    };
  }

  async getTopInvoiceCustomers(matchQuery, limit) {
    const topCustomers = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$clientName',
          totalAmount: { $sum: '$total' },
          invoiceCount: { $sum: 1 },
          avgAmount: { $avg: '$total' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: limit }
    ]);

    return {
      type: 'top_customers',
      customers: topCustomers,
      summary: `Top ${limit} Pelanggan Invois: ${topCustomers.map(c => `${c._id} (RM${c.totalAmount.toLocaleString()})`).join(', ')}`
    };
  }

  async getInvoiceSummary(matchQuery) {
    const summary = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          paidAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] } },
          outstandingAmount: { $sum: { $cond: [{ $in: ['$status', ['sent', 'draft', 'overdue']] }, '$total', 0] } },
          overdueAmount: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, '$total', 0] } }
        }
      }
    ]);

    const data = summary[0] || {
      totalInvoices: 0, totalAmount: 0, paidAmount: 0, outstandingAmount: 0, overdueAmount: 0
    };

    return {
      type: 'summary',
      totalInvoices: data.totalInvoices,
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount,
      outstandingAmount: data.outstandingAmount,
      overdueAmount: data.overdueAmount,
      summary: `Ringkasan Invois: ${data.totalInvoices} dokumen, Total: RM${data.totalAmount.toLocaleString()}, Dibayar: RM${data.paidAmount.toLocaleString()}, Tertunggak: RM${data.outstandingAmount.toLocaleString()}, Overdue: RM${data.overdueAmount.toLocaleString()}`
    };
  }

  async getQuoteConversionAnalysis(matchQuery) {
    const quotes = await Invoice.find(matchQuery).lean();
    const totalAmount = quotes.reduce((sum, quote) => sum + quote.total, 0);

    return {
      type: 'conversion',
      totalQuotes: quotes.length,
      totalAmount,
      summary: `Analisis Sebut Harga: ${quotes.length} dokumen, Jumlah: RM${totalAmount.toLocaleString()}`
    };
  }

  async getPendingQuotes(matchQuery, limit) {
    const pending = await Invoice.find({
      ...matchQuery,
      status: { $in: ['sent', 'draft'] }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    const totalAmount = pending.reduce((sum, quote) => sum + quote.total, 0);

    return {
      type: 'pending',
      quotes: pending.map(quote => ({
        documentNumber: quote.invoiceNumber,
        customer: quote.clientName,
        amount: quote.total,
        status: quote.status,
        createdAt: quote.createdAt
      })),
      totalAmount,
      count: pending.length,
      summary: `Sebut Harga Pending: ${pending.length} dokumen, Jumlah: RM${totalAmount.toLocaleString()}`
    };
  }

  async getRecentQuotes(matchQuery, limit) {
    const recent = await Invoice.find(matchQuery)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    const totalAmount = recent.reduce((sum, quote) => sum + quote.total, 0);

    return {
      type: 'recent',
      quotes: recent.map(quote => ({
        documentNumber: quote.invoiceNumber,
        customer: quote.clientName,
        amount: quote.total,
        status: quote.status,
        createdAt: quote.createdAt
      })),
      totalAmount,
      count: recent.length,
      summary: `Sebut Harga Terkini: ${recent.length} dokumen, Jumlah: RM${totalAmount.toLocaleString()}`
    };
  }

  async getTopQuoteCustomers(matchQuery, limit) {
    const topCustomers = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$clientName',
          totalAmount: { $sum: '$total' },
          quoteCount: { $sum: 1 },
          avgAmount: { $avg: '$total' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: limit }
    ]);

    return {
      type: 'top_customers',
      customers: topCustomers,
      summary: `Top ${limit} Pelanggan Sebut Harga: ${topCustomers.map(c => `${c._id} (RM${c.totalAmount.toLocaleString()})`).join(', ')}`
    };
  }

  async getQuoteSummary(matchQuery) {
    const summary = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalQuotes: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          pendingAmount: { $sum: { $cond: [{ $in: ['$status', ['sent', 'draft']] }, '$total', 0] } }
        }
      }
    ]);

    const data = summary[0] || {
      totalQuotes: 0, totalAmount: 0, pendingAmount: 0
    };

    return {
      type: 'summary',
      totalQuotes: data.totalQuotes,
      totalAmount: data.totalAmount,
      pendingAmount: data.pendingAmount,
      summary: `Ringkasan Sebut Harga: ${data.totalQuotes} dokumen, Total: RM${data.totalAmount.toLocaleString()}, Pending: RM${data.pendingAmount.toLocaleString()}`
    };
  }

  // Main process method
  async process(message, context = {}) {
    try {
      const response = await this.processMessage(message, context);
      
      // Check if AI wants to use tools
      if (response.choices[0].message.tool_calls) {
        const toolResults = await this.handleToolCalls(
          response.choices[0].message.tool_calls,
          context
        );
        
        return {
          type: 'tool_result',
          content: toolResults,
          toolCalls: response.choices[0].message.tool_calls
        };
      }
      
      // Return regular AI response
      return {
        type: 'text',
        content: response.choices[0].message.content
      };
      
    } catch (error) {
      console.error('MCP Server Error:', error);
      return {
        type: 'error',
        content: 'Maaf, berlaku ralat semasa memproses permintaan anda. Sila cuba lagi.'
      };
    }
  }
}

module.exports = GroqMCPServer;
