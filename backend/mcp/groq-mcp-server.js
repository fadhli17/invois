const { Groq } = require('groq-sdk');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

class GroqMCPServer {
  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('GROQ_API_KEY tidak ditemui, menggunakan mode fallback');
      this.groq = null;
      this.model = 'llama-3.1-8b-instant';
    } else {
    this.groq = new Groq({ apiKey });
    this.model = 'llama-3.1-8b-instant';
    }
    // Initialize available tools once
    this.tools = this.getTools();
  }

  // Update API key at runtime and reinitialize client
  setApiKey(newKey) {
    try {
      if (newKey && typeof newKey === 'string' && newKey.trim()) {
        this.groq = new Groq({ apiKey: newKey.trim() });
        process.env.GROQ_API_KEY = newKey.trim();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to set Groq API key:', err.message);
      return false;
    }
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
                description: 'Search term for customer name, company, or email. Can be partial name like "ali" to find "Ali Ahmad", "Ali Sdn Bhd", etc.'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'searchCustomers',
          description: 'Search customers by partial name, company, or email with detailed results',
          parameters: {
            type: 'object',
            properties: {
              searchTerm: {
                type: 'string',
                description: 'Partial search term (e.g., "ali", "ahmad", "sdn") to find customers'
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 20)'
              }
            },
            required: ['searchTerm']
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
      },
      {
        type: 'function',
        function: {
          name: 'generateTermsAndConditions',
          description: 'Generate terms and conditions for invoices based on business context',
          parameters: {
            type: 'object',
            properties: {
              businessType: {
                type: 'string',
                description: 'Type of business (e.g., "IT services", "retail", "consulting")'
              },
              notes: {
                type: 'string',
                description: 'Additional context or specific requirements for terms'
              },
              language: {
                type: 'string',
                enum: ['malay', 'english'],
                description: 'Language for the terms and conditions'
              }
            },
            required: ['businessType']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getMonthlyTrends',
          description: 'Analyze monthly trends for revenue, invoices, and customer growth',
          parameters: {
            type: 'object',
            properties: {
              months: {
                type: 'number',
                description: 'Number of months to analyze (default: 6)'
              },
              includeProjections: {
                type: 'boolean',
                description: 'Include future projections based on trends'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'searchDocumentsByDate',
          description: 'Search for invoices and quotes within a specific date range',
          parameters: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format'
              },
              endDate: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format'
              },
              documentType: {
                type: 'string',
                enum: ['invoice', 'quote', 'all'],
                description: 'Type of document to search for'
              },
              status: {
                type: 'string',
                enum: ['draft', 'sent', 'paid', 'overdue', 'all'],
                description: 'Status filter for documents'
              }
            },
            required: ['startDate', 'endDate']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getTopCustomers',
          description: 'Get top customers by revenue, number of invoices, or recent activity',
          parameters: {
            type: 'object',
            properties: {
              sortBy: {
                type: 'string',
                enum: ['revenue', 'count', 'recent'],
                description: 'Sort customers by revenue, invoice count, or recent activity'
              },
              limit: {
                type: 'number',
                description: 'Number of top customers to return (default: 10)'
              },
              timeframe: {
                type: 'string',
                description: 'Time period for analysis (e.g., "last_30_days", "this_year")'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getRevenueForecast',
          description: 'Generate revenue forecast based on historical data and trends',
          parameters: {
            type: 'object',
            properties: {
              months: {
                type: 'number',
                description: 'Number of months to forecast (default: 3)'
              },
              confidence: {
                type: 'string',
                enum: ['conservative', 'moderate', 'optimistic'],
                description: 'Confidence level for the forecast'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getOverdueAnalysis',
          description: 'Analyze overdue invoices and provide collection insights',
          parameters: {
            type: 'object',
            properties: {
              includeSuggestions: {
                type: 'boolean',
                description: 'Include suggestions for collection actions'
              },
              groupBy: {
                type: 'string',
                enum: ['customer', 'amount', 'days_overdue'],
                description: 'Group overdue invoices by customer, amount, or days overdue'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getBusinessInsights',
          description: 'Generate comprehensive business insights and recommendations',
          parameters: {
            type: 'object',
            properties: {
              focus: {
                type: 'string',
                enum: ['revenue', 'customers', 'efficiency', 'growth'],
                description: 'Focus area for insights'
              },
              includeRecommendations: {
                type: 'boolean',
                description: 'Include actionable recommendations'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getDocumentStats',
          description: 'Get comprehensive statistics about all documents',
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
                description: 'Time period for statistics'
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
      // Check if Groq is available
      if (!this.groq) {
        return this.handleFallbackResponse(message, context);
      }

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
  
  // Fallback to simple response if API fails
  return this.handleFallbackResponse(message, context);
}
  }

  // Fallback response when Groq API is not available
  async handleFallbackResponse(message, context = {}) {
    const lowerMessage = message.toLowerCase();
    
    // Try to use tool calls for data queries even without Groq API
    if (lowerMessage.includes('pelanggan') || lowerMessage.includes('customer')) {
      if (lowerMessage.includes('berapa') || lowerMessage.includes('jumlah') || lowerMessage.includes('banyak')) {
        return {
          choices: [{
            message: {
              content: 'Saya akan mendapatkan maklumat pelanggan untuk anda...',
              tool_calls: [{
                type: 'function',
                function: {
                  name: 'getCustomerAnalysis',
                  arguments: JSON.stringify({ limit: 10 })
                }
              }]
            }
          }]
        };
      } else if (lowerMessage.includes('cari') || lowerMessage.includes('tunjukkan') || lowerMessage.includes('cari')) {
        // Extract search term from message
        const searchTerm = message.replace(/[^\w\s]/gi, '').trim();
        return {
          choices: [{
            message: {
              content: `Saya akan mencari pelanggan dengan kata kunci "${searchTerm}"...`,
              tool_calls: [{
                type: 'function',
                function: {
                  name: 'searchCustomers',
                  arguments: JSON.stringify({ 
                    searchTerm: searchTerm,
                    limit: 20
                  })
                }
              }]
            }
          }]
        };
      }
    }
    
    if (lowerMessage.includes('invois') || lowerMessage.includes('invoice')) {
      if (lowerMessage.includes('berapa') || lowerMessage.includes('jumlah') || lowerMessage.includes('banyak')) {
        return {
          choices: [{
            message: {
              content: 'Saya akan mendapatkan analisis invois untuk anda...',
              tool_calls: [{
                type: 'function',
                function: {
                  name: 'getDetailedInvoiceAnalysis',
                  arguments: JSON.stringify({ analysisType: 'summary' })
                }
              }]
            }
          }]
        };
      } else if (lowerMessage.includes('tunjukkan') || lowerMessage.includes('lihat')) {
        return {
          choices: [{
            message: {
              content: 'Saya akan mendapatkan senarai invois untuk anda...',
              tool_calls: [{
                type: 'function',
                function: {
                  name: 'getDocuments',
                  arguments: JSON.stringify({ documentType: 'invoice' })
                }
              }]
            }
          }]
        };
      }
    }
    
    if (lowerMessage.includes('sebut harga') || lowerMessage.includes('quote')) {
      if (lowerMessage.includes('berapa') || lowerMessage.includes('jumlah') || lowerMessage.includes('banyak')) {
        return {
          choices: [{
            message: {
              content: 'Saya akan mendapatkan analisis sebut harga untuk anda...',
              tool_calls: [{
                type: 'function',
                function: {
                  name: 'getQuoteAnalysis',
                  arguments: JSON.stringify({ analysisType: 'summary' })
                }
              }]
            }
          }]
        };
      } else if (lowerMessage.includes('tunjukkan') || lowerMessage.includes('lihat')) {
        return {
          choices: [{
            message: {
              content: 'Saya akan mendapatkan senarai sebut harga untuk anda...',
              tool_calls: [{
                type: 'function',
                function: {
                  name: 'getDocuments',
                  arguments: JSON.stringify({ documentType: 'quote' })
                }
              }]
            }
          }]
        };
      }
    }
    
    if (lowerMessage.includes('revenue') || lowerMessage.includes('pendapatan') || lowerMessage.includes('jualan')) {
      return {
        choices: [{
          message: {
            content: 'Saya akan mendapatkan analisis revenue untuk anda...',
            tool_calls: [{
              type: 'function',
              function: {
                name: 'getRevenueAnalysis',
                arguments: JSON.stringify({ documentType: 'all' })
              }
            }]
          }
        }]
      };
    }
    
    if (lowerMessage.includes('laporan') || lowerMessage.includes('analisis') || lowerMessage.includes('statistik')) {
      return {
        choices: [{
          message: {
            content: 'Saya akan mendapatkan laporan bulanan untuk anda...',
            tool_calls: [{
              type: 'function',
              function: {
                name: 'getMonthlyReport',
                arguments: JSON.stringify({})
              }
            }]
          }
        }]
      };
    }
    
    // Handle revenue and payment queries
    if (lowerMessage.includes('revenue') || lowerMessage.includes('pendapatan') || lowerMessage.includes('jualan') || lowerMessage.includes('bayar')) {
      return {
        choices: [{
          message: {
            content: 'Saya akan mendapatkan analisis revenue untuk anda...',
            tool_calls: [{
              type: 'function',
              function: {
                name: 'getRevenueAnalysis',
                arguments: JSON.stringify({ documentType: 'all' })
              }
            }]
          }
        }]
      };
    }
    
    // Handle outstanding amounts queries
    if (lowerMessage.includes('tertunggak') || lowerMessage.includes('baki') || lowerMessage.includes('belum bayar')) {
      return {
        choices: [{
          message: {
            content: 'Saya akan mendapatkan analisis jumlah tertunggak untuk anda...',
            tool_calls: [{
              type: 'function',
              function: {
                name: 'getOutstandingAmounts',
                arguments: JSON.stringify({ documentType: 'all' })
              }
            }]
          }
        }]
      };
    }
    
    // Handle document queries
    if (lowerMessage.includes('dokumen') || lowerMessage.includes('invois') || lowerMessage.includes('sebut harga')) {
      if (lowerMessage.includes('tunjukkan') || lowerMessage.includes('lihat') || lowerMessage.includes('senarai')) {
        const docType = lowerMessage.includes('sebut harga') ? 'quote' : 'invoice';
        return {
          choices: [{
            message: {
              content: `Saya akan mendapatkan senarai ${docType === 'quote' ? 'sebut harga' : 'invois'} untuk anda...`,
              tool_calls: [{
                type: 'function',
                function: {
                  name: 'getDocuments',
                  arguments: JSON.stringify({ documentType: docType })
                }
              }]
            }
          }]
        };
      }
    }
    
    // Handle customer creation
    if (lowerMessage.includes('tambah pelanggan') || lowerMessage.includes('daftar pelanggan') || lowerMessage.includes('buat pelanggan')) {
      // Extract customer information from message
      const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      const nameMatch = message.match(/(?:tambah|daftar|buat)\s+pelanggan\s+([^dengan|with|@]+?)(?:\s+dengan|\s+with|\s+@|$)/i);
      
      const customerName = nameMatch ? nameMatch[1].trim() : 'Pelanggan Baru';
      const customerEmail = emailMatch ? emailMatch[1] : `${customerName.toLowerCase().replace(/\s+/g, '')}@example.com`;
      
      return {
        choices: [{
          message: {
            content: `Saya akan menambah pelanggan "${customerName}" untuk anda...`,
            tool_calls: [{
              type: 'function',
              function: {
                name: 'createCustomer',
                arguments: JSON.stringify({
                  name: customerName,
                  email: customerEmail,
                  company: customerName.includes('Sdn') || customerName.includes('Bhd') ? customerName : '',
                  phone: '',
                  address: ''
                })
              }
            }]
          }
        }]
      };
    }
    
    // Handle trend analysis
    if (lowerMessage.includes('trend') || lowerMessage.includes('analisis bulanan') || lowerMessage.includes('pertumbuhan')) {
      return {
        choices: [{
          message: {
            content: 'Saya akan menganalisis trend bulanan untuk anda...',
            tool_calls: [{
              type: 'function',
              function: {
                name: 'getMonthlyTrends',
                arguments: JSON.stringify({
                  months: 6,
                  includeProjections: true
                })
              }
            }]
          }
        }]
      };
    }
    
    // Handle top customers queries
    if (lowerMessage.includes('pelanggan terbaik') || lowerMessage.includes('top customer') || lowerMessage.includes('pelanggan utama')) {
      return {
        choices: [{
          message: {
            content: 'Saya akan mendapatkan senarai pelanggan terbaik untuk anda...',
            tool_calls: [{
              type: 'function',
              function: {
                name: 'getTopCustomers',
                arguments: JSON.stringify({
                  sortBy: 'revenue',
                  limit: 10,
                  timeframe: 'all'
                })
              }
            }]
          }
        }]
      };
    }
    
    // Handle revenue forecast
    if (lowerMessage.includes('ramalan') || lowerMessage.includes('forecast') || lowerMessage.includes('projeksi')) {
      return {
        choices: [{
          message: {
            content: 'Saya akan membuat ramalan pendapatan untuk anda...',
            tool_calls: [{
              type: 'function',
              function: {
                name: 'getRevenueForecast',
                arguments: JSON.stringify({
                  months: 3,
                  confidence: 'moderate'
                })
              }
            }]
          }
        }]
      };
    }
    
    // Handle overdue analysis
    if (lowerMessage.includes('tertunggak') || lowerMessage.includes('overdue') || lowerMessage.includes('belum bayar')) {
      return {
        choices: [{
          message: {
            content: 'Saya akan menganalisis invois tertunggak untuk anda...',
            tool_calls: [{
              type: 'function',
              function: {
                name: 'getOverdueAnalysis',
                arguments: JSON.stringify({
                  includeSuggestions: true,
                  groupBy: 'customer'
                })
              }
            }]
          }
        }]
      };
    }
    
    // Handle business insights
    if (lowerMessage.includes('pandangan') || lowerMessage.includes('insight') || lowerMessage.includes('cadangan')) {
      return {
        choices: [{
          message: {
            content: 'Saya akan memberikan pandangan perniagaan untuk anda...',
            tool_calls: [{
              type: 'function',
              function: {
                name: 'getBusinessInsights',
                arguments: JSON.stringify({
                  focus: 'revenue',
                  includeRecommendations: true
                })
              }
            }]
          }
        }]
      };
    }
    
    // Handle document statistics
    if (lowerMessage.includes('statistik') || lowerMessage.includes('statistics') || lowerMessage.includes('jumlah dokumen')) {
      return {
        choices: [{
          message: {
            content: 'Saya akan mendapatkan statistik dokumen untuk anda...',
            tool_calls: [{
              type: 'function',
              function: {
                name: 'getDocumentStats',
                arguments: JSON.stringify({
                  documentType: 'all',
                  timeframe: 'all'
                })
              }
            }]
          }
        }]
      };
    }
    
    // Handle date range search
    if (lowerMessage.includes('cari dokumen') && (lowerMessage.includes('dari') || lowerMessage.includes('hingga'))) {
      // Extract dates from message
      const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/g);
      if (dateMatch && dateMatch.length >= 2) {
        return {
          choices: [{
            message: {
              content: `Saya akan mencari dokumen dari ${dateMatch[0]} hingga ${dateMatch[1]}...`,
              tool_calls: [{
                type: 'function',
                function: {
                  name: 'searchDocumentsByDate',
                  arguments: JSON.stringify({
                    startDate: dateMatch[0],
                    endDate: dateMatch[1],
                    documentType: 'all',
                    status: 'all'
                  })
                }
              }]
            }
          }]
        };
      }
    }
    
    if (lowerMessage.includes('buat') && (lowerMessage.includes('invois') || lowerMessage.includes('sebut harga'))) {
      // Extract information from the message
      const documentType = lowerMessage.includes('sebut harga') ? 'quote' : 'invoice';
      const docTypeName = documentType === 'quote' ? 'Sebut Harga' : 'Invois';
      
      // Try to extract customer name and items from the message
      let customerName = 'Pelanggan Baru';
      let items = [];
      
      // Extract customer name (look for "untuk" or "for")
      const customerMatch = message.match(/(?:untuk|for)\s+([^dengan|with]+?)(?:\s+dengan|\s+with|$)/i);
      if (customerMatch) {
        customerName = customerMatch[1].trim();
      }
      
      // Extract items (look for patterns like "2 laptop RM3000")
      const itemMatches = message.match(/(\d+)\s+([^RM]+?)\s+RM(\d+)/gi);
      if (itemMatches) {
        items = itemMatches.map(match => {
          const parts = match.match(/(\d+)\s+([^RM]+?)\s+RM(\d+)/i);
          if (parts) {
            return {
              name: parts[2].trim(),
              quantity: parseInt(parts[1]),
              price: parseInt(parts[3])
            };
          }
          return null;
        }).filter(item => item !== null);
      }
      
      // If no items found, create a default item
      if (items.length === 0) {
        items = [{
          name: 'Item 1',
          quantity: 1,
          price: 100
        }];
      }
      
      return {
        choices: [{
          message: {
            content: `Saya akan membuat ${docTypeName} untuk ${customerName}...`,
            tool_calls: [{
              type: 'function',
              function: {
                name: 'createDocument',
                arguments: JSON.stringify({
                  documentType: documentType,
                  customer: customerName,
                  items: items,
                  dueDate: '30 days',
                  notes: `Dibuat melalui AI Chat - ${new Date().toLocaleDateString('ms-MY')}`
                })
              }
            }]
          }
        }]
      };
    }
    
    // Default response
    return {
      choices: [{
        message: {
          content: 'Saya adalah AI assistant untuk sistem pengurusan invois. Sila gunakan menu di sebelah kiri untuk navigasi ke fungsi yang anda perlukan. Untuk bantuan lebih lanjut, sila rujuk panduan pengguna.',
          tool_calls: null
        }
      }]
    };
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
            
          case 'searchCustomers':
            result = await this.searchCustomers(parsedArgs, context);
            results.push(`🔍 Pencarian "${parsedArgs.searchTerm}": Ditemui ${result.length} pelanggan.`);
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
            
          case 'generateTermsAndConditions':
            result = await this.generateTermsAndConditions(parsedArgs, context);
            results.push(`📝 Terma dan Syarat telah dijana untuk ${parsedArgs.businessType}`);
            break;
            
          case 'getMonthlyTrends':
            result = await this.getMonthlyTrends(parsedArgs, context);
            results.push(`📈 Analisis trend bulanan: ${result.summary}`);
            break;
            
          case 'searchDocumentsByDate':
            result = await this.searchDocumentsByDate(parsedArgs, context);
            results.push(`📅 Dokumen dalam tempoh ${parsedArgs.startDate} hingga ${parsedArgs.endDate}: ${result.length} ditemui.`);
            break;
            
          case 'getTopCustomers':
            result = await this.getTopCustomers(parsedArgs, context);
            results.push(`🏆 Top ${parsedArgs.limit || 10} pelanggan berdasarkan ${parsedArgs.sortBy}: ${result.summary}`);
            break;
            
          case 'getRevenueForecast':
            result = await this.getRevenueForecast(parsedArgs, context);
            results.push(`🔮 Ramalan pendapatan ${parsedArgs.months || 3} bulan: ${result.summary}`);
            break;
            
          case 'getOverdueAnalysis':
            result = await this.getOverdueAnalysis(parsedArgs, context);
            results.push(`⚠️ Analisis invois tertunggak: ${result.summary}`);
            break;
            
          case 'getBusinessInsights':
            result = await this.getBusinessInsights(parsedArgs, context);
            results.push(`💡 Pandangan perniagaan (${parsedArgs.focus}): ${result.summary}`);
            break;
            
          case 'getDocumentStats':
            result = await this.getDocumentStats(parsedArgs, context);
            results.push(`📊 Statistik dokumen: ${result.summary}`);
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
      
      // Add search filter with improved matching
      if (filters && filters.search) {
        const searchTerm = filters.search.trim();
        
        // Split search term into words for partial matching
        const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
        
        if (searchWords.length > 0) {
          // Create regex patterns for each word
          const namePatterns = searchWords.map(word => ({
            name: { $regex: word, $options: 'i' }
          }));
          
          const companyPatterns = searchWords.map(word => ({
            company: { $regex: word, $options: 'i' }
          }));
          
          const emailPatterns = searchWords.map(word => ({
            email: { $regex: word, $options: 'i' }
          }));

          // Search for any word matching in name, company, or email
        query.$or = [
            ...namePatterns,
            ...companyPatterns,
            ...emailPatterns,
            // Also search for exact phrase match
            { name: { $regex: searchTerm, $options: 'i' } },
            { company: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
          ];
        }
      }

      // Get customers from database
      const customers = await Customer.find(query)
        .sort({ name: 1 })
        .limit(50) // Limit to 50 customers
        .lean();

      // Format customers for response with match highlighting
      const formattedCustomers = customers.map(customer => {
        let matchInfo = '';
        if (filters && filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const name = customer.name.toLowerCase();
          const company = (customer.company || '').toLowerCase();
          const email = customer.email.toLowerCase();
          
          if (name.includes(searchTerm)) {
            matchInfo = ' (Nama)';
          } else if (company.includes(searchTerm)) {
            matchInfo = ' (Syarikat)';
          } else if (email.includes(searchTerm)) {
            matchInfo = ' (Email)';
          }
        }

        return {
        id: customer._id,
          name: customer.name + matchInfo,
        company: customer.company,
        email: customer.email,
        phone: customer.phone,
        fullAddress: customer.fullAddress,
        totalInvoices: customer.totalInvoices || 0,
        totalAmount: customer.totalAmount || 0,
        lastInvoiceDate: customer.lastInvoiceDate,
        createdAt: customer.createdAt
        };
      });

      return formattedCustomers;

    } catch (error) {
      console.error('Error getting customers:', error);
      throw new Error(`Gagal mendapatkan pelanggan: ${error.message}`);
    }
  }

  async searchCustomers(filters, context) {
    try {
      const userId = context.userId;
      const searchTerm = filters.searchTerm.trim();
      const limit = filters.limit || 20;
      
      if (!searchTerm) {
        return [];
      }

      // Build advanced search query
      const query = { 
        userId: context.userId, 
        status: 'active',
        $or: [
          // Search in name (partial match)
          { name: { $regex: searchTerm, $options: 'i' } },
          // Search in company (partial match)
          { company: { $regex: searchTerm, $options: 'i' } },
          // Search in email (partial match)
          { email: { $regex: searchTerm, $options: 'i' } },
          // Search in phone (partial match)
          { phone: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      // Get customers from database
      const customers = await Customer.find(query)
        .sort({ name: 1 })
        .limit(limit)
        .lean();

      // Format customers with detailed match information
      const formattedCustomers = customers.map(customer => {
        const searchLower = searchTerm.toLowerCase();
        const name = customer.name.toLowerCase();
        const company = (customer.company || '').toLowerCase();
        const email = customer.email.toLowerCase();
        const phone = (customer.phone || '').toLowerCase();
        
        let matchType = '';
        let matchDetails = [];
        
        if (name.includes(searchLower)) {
          matchType = 'Nama';
          matchDetails.push(`Nama: ${customer.name}`);
        }
        if (company.includes(searchLower)) {
          matchType = matchType ? 'Nama/Syarikat' : 'Syarikat';
          matchDetails.push(`Syarikat: ${customer.company}`);
        }
        if (email.includes(searchLower)) {
          matchType = matchType ? 'Nama/Syarikat/Email' : 'Email';
          matchDetails.push(`Email: ${customer.email}`);
        }
        if (phone.includes(searchLower)) {
          matchType = matchType ? 'Nama/Syarikat/Email/Telefon' : 'Telefon';
          matchDetails.push(`Telefon: ${customer.phone}`);
        }

        return {
          id: customer._id,
          name: customer.name,
          company: customer.company || 'Tiada syarikat',
          email: customer.email,
          phone: customer.phone || 'Tiada telefon',
          fullAddress: customer.fullAddress || 'Tiada alamat',
          matchType: matchType,
          matchDetails: matchDetails.join(', '),
          totalInvoices: customer.totalInvoices || 0,
          totalAmount: customer.totalAmount || 0,
          lastInvoiceDate: customer.lastInvoiceDate,
          createdAt: customer.createdAt
        };
      });

      return formattedCustomers;

    } catch (error) {
      console.error('Error searching customers:', error);
      throw new Error(`Gagal mencari pelanggan: ${error.message}`);
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

  // Generate terms and conditions
  async generateTermsAndConditions(args, context = {}) {
    try {
      const { businessType, notes, language = 'malay', shorten = false } = args;
      
      // Create a prompt for generating terms and conditions
      let prompt;
      
      if (shorten || (notes && notes.toLowerCase().includes('ringkaskan'))) {
        prompt = `Generate SHORT and CONCISE terms and conditions for a ${businessType} business in ${language === 'malay' ? 'Bahasa Malaysia' : 'English'}. ${notes ? `Additional requirements: ${notes}` : ''}

Make it very brief (1-3 lines maximum) with only the most essential terms:
- Payment terms
- Basic liability
- Governing law

Keep it simple and professional.`;
      } else {
        prompt = `Generate comprehensive terms and conditions for a ${businessType} business in ${language === 'malay' ? 'Bahasa Malaysia' : 'English'}. ${notes ? `Additional requirements: ${notes}` : ''}

Please include standard clauses for:
- Payment terms and conditions
- Delivery/service terms
- Liability and warranty
- Cancellation policy
- Force majeure
- Governing law
- Contact information

Format the response as a clean, professional terms and conditions document.`;
      }

      if (!this.groq) {
        // Fallback response when Groq is not available
        let fallbackTerms;
        
        if (shorten || (notes && notes.toLowerCase().includes('ringkaskan'))) {
          // Short version
          fallbackTerms = language === 'malay' ? 
            `TERMA DAN SYARAT:
1. Pembayaran dalam tempoh 30 hari dari tarikh invois.
2. Bayaran lewat dikenakan faedah 1.5% sebulan.
3. Tertakluk kepada undang-undang Malaysia.` :
            `TERMS AND CONDITIONS:
1. Payment within 30 days from invoice date.
2. Late payments incur 1.5% monthly interest.
3. Subject to Malaysian law.`;
        } else {
          // Full version
          fallbackTerms = language === 'malay' ? 
            `TERMA DAN SYARAT

1. PEMBAYARAN
   - Pembayaran hendaklah dibuat dalam tempoh 30 hari dari tarikh invois
   - Bayaran lewat akan dikenakan caj faedah sebanyak 1.5% sebulan
   - Semua harga adalah dalam Ringgit Malaysia (RM)

2. PENGHANTARAN/PERKHIDMATAN
   - Penghantaran/perkhidmatan akan dibuat mengikut jadual yang dipersetujui
   - Pelanggan bertanggungjawab untuk menyediakan akses yang diperlukan

3. JAMINAN
   - Produk/perkhidmatan dijamin mengikut spesifikasi yang dipersetujui
   - Jaminan terhad kepada pembaikan atau penggantian sahaja

4. PEMBATALAN
   - Pembatalan hendaklah dibuat secara bertulis dengan notis 7 hari
   - Caj pembatalan mungkin dikenakan untuk kos yang telah ditanggung

5. UNDANG-UNDANG
   - Terma ini tertakluk kepada undang-undang Malaysia
   - Sebarang pertikaian akan diselesaikan melalui mahkamah Malaysia

Untuk sebarang pertanyaan, sila hubungi kami.` :
            `TERMS AND CONDITIONS

1. PAYMENT
   - Payment shall be made within 30 days from invoice date
   - Late payments will incur interest charges of 1.5% per month
   - All prices are in Malaysian Ringgit (RM)

2. DELIVERY/SERVICE
   - Delivery/service will be made according to agreed schedule
   - Customer is responsible for providing necessary access

3. WARRANTY
   - Products/services are warranted according to agreed specifications
   - Warranty limited to repair or replacement only

4. CANCELLATION
   - Cancellation must be made in writing with 7 days notice
   - Cancellation charges may apply for costs already incurred

5. GOVERNING LAW
   - These terms are subject to Malaysian law
   - Any disputes will be resolved through Malaysian courts

For any inquiries, please contact us.`;
        }

        return {
          type: 'terms',
          content: fallbackTerms,
          businessType: businessType,
          language: language
        };
      }

      // Use Groq to generate terms
      try {
        const completion = await this.groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a legal assistant specializing in business terms and conditions. Generate professional, comprehensive terms and conditions documents.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: this.model,
          temperature: 0.3,
          max_tokens: 2000
        });

        const generatedTerms = completion.choices[0]?.message?.content || '';

        return {
          type: 'terms',
          content: generatedTerms,
          businessType: businessType,
          language: language,
          source: 'groq'
        };
      } catch (groqError) {
        console.error('Groq API Error for terms generation:', groqError);
        
        // Fallback to predefined terms when Groq fails
        let fallbackTerms;
        
        if (shorten || (notes && notes.toLowerCase().includes('ringkaskan'))) {
          // Short version
          fallbackTerms = language === 'malay' ? 
            `TERMA DAN SYARAT:
1. Pembayaran dalam tempoh 30 hari dari tarikh invois.
2. Bayaran lewat dikenakan faedah 1.5% sebulan.
3. Tertakluk kepada undang-undang Malaysia.` :
            `TERMS AND CONDITIONS:
1. Payment within 30 days from invoice date.
2. Late payments incur 1.5% monthly interest.
3. Subject to Malaysian law.`;
        } else {
          // Full version
          fallbackTerms = language === 'malay' ? 
            `TERMA DAN SYARAT

1. PEMBAYARAN
   - Pembayaran hendaklah dibuat dalam tempoh 30 hari dari tarikh invois
   - Bayaran lewat akan dikenakan caj faedah sebanyak 1.5% sebulan
   - Semua harga adalah dalam Ringgit Malaysia (RM)

2. PENGHANTARAN/PERKHIDMATAN
   - Penghantaran/perkhidmatan akan dibuat mengikut jadual yang dipersetujui
   - Pelanggan bertanggungjawab untuk menyediakan akses yang diperlukan

3. JAMINAN
   - Produk/perkhidmatan dijamin mengikut spesifikasi yang dipersetujui
   - Jaminan terhad kepada pembaikan atau penggantian sahaja

4. PEMBATALAN
   - Pembatalan hendaklah dibuat secara bertulis dengan notis 7 hari
   - Caj pembatalan mungkin dikenakan untuk kos yang telah ditanggung

5. UNDANG-UNDANG
   - Terma ini tertakluk kepada undang-undang Malaysia
   - Sebarang pertikaian akan diselesaikan melalui mahkamah Malaysia

Untuk sebarang pertanyaan, sila hubungi kami.` :
            `TERMS AND CONDITIONS

1. PAYMENT
   - Payment shall be made within 30 days from invoice date
   - Late payments will incur interest charges of 1.5% per month
   - All prices are in Malaysian Ringgit (RM)

2. DELIVERY/SERVICE
   - Delivery/service will be made according to agreed schedule
   - Customer is responsible for providing necessary access

3. WARRANTY
   - Products/services are warranted according to agreed specifications
   - Warranty limited to repair or replacement only

4. CANCELLATION
   - Cancellation must be made in writing with 7 days notice
   - Cancellation charges may apply for costs already incurred

5. GOVERNING LAW
   - These terms are subject to Malaysian law
   - Any disputes will be resolved through Malaysian courts

For any inquiries, please contact us.`;
        }

        return {
          type: 'terms',
          content: fallbackTerms,
          businessType: businessType,
          language: language,
          source: 'fallback'
        };
      }

    } catch (error) {
      console.error('Error generating terms and conditions:', error);
      throw new Error(`Gagal menjana terma dan syarat: ${error.message}`);
    }
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

  // Get monthly trends analysis
  async getMonthlyTrends(args, context = {}) {
    try {
      const { months = 6, includeProjections = false } = args;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Get invoices for the period
      const invoices = await Invoice.find({
        createdAt: { $gte: startDate, $lte: endDate },
        documentType: 'invoice'
      }).sort({ createdAt: 1 });

      // Calculate monthly data
      const monthlyData = {};
      invoices.forEach(invoice => {
        const month = invoice.createdAt.toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, count: 0, customers: new Set() };
        }
        monthlyData[month].revenue += invoice.total || 0;
        monthlyData[month].count += 1;
        monthlyData[month].customers.add(invoice.clientName);
      });

      // Convert to array and calculate growth
      const trends = Object.keys(monthlyData).map(month => ({
        month,
        revenue: monthlyData[month].revenue,
        count: monthlyData[month].count,
        customers: monthlyData[month].customers.size
      }));

      // Calculate growth rates
      const revenueGrowth = trends.length > 1 ? 
        ((trends[trends.length - 1].revenue - trends[0].revenue) / trends[0].revenue * 100) : 0;
      
      const countGrowth = trends.length > 1 ? 
        ((trends[trends.length - 1].count - trends[0].count) / trends[0].count * 100) : 0;

      let summary = `Trend ${months} bulan terakhir:\n`;
      summary += `• Pendapatan: RM${trends.reduce((sum, t) => sum + t.revenue, 0).toLocaleString()}\n`;
      summary += `• Jumlah invois: ${trends.reduce((sum, t) => sum + t.count, 0)}\n`;
      summary += `• Pertumbuhan pendapatan: ${revenueGrowth.toFixed(1)}%\n`;
      summary += `• Pertumbuhan invois: ${countGrowth.toFixed(1)}%`;

      if (includeProjections) {
        const avgMonthlyRevenue = trends.reduce((sum, t) => sum + t.revenue, 0) / trends.length;
        const projectedRevenue = avgMonthlyRevenue * 3; // Next 3 months
        summary += `\n• Ramalan 3 bulan: RM${projectedRevenue.toLocaleString()}`;
      }

      return {
        trends,
        summary,
        revenueGrowth,
        countGrowth,
        totalRevenue: trends.reduce((sum, t) => sum + t.revenue, 0),
        totalInvoices: trends.reduce((sum, t) => sum + t.count, 0)
      };
    } catch (error) {
      console.error('Error getting monthly trends:', error);
      return {
        trends: [],
        summary: 'Ralat semasa menganalisis trend bulanan',
        error: error.message
      };
    }
  }

  // Search documents by date range
  async searchDocumentsByDate(args, context = {}) {
    try {
      const { startDate, endDate, documentType = 'all', status = 'all' } = args;
      
      const query = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };

      if (documentType !== 'all') {
        query.documentType = documentType;
      }

      if (status !== 'all') {
        query.status = status;
      }

      const documents = await Invoice.find(query).sort({ createdAt: -1 });

      const summary = `Ditemui ${documents.length} dokumen dalam tempoh ${startDate} hingga ${endDate}`;
      
      return {
        documents,
        summary,
        count: documents.length,
        totalAmount: documents.reduce((sum, doc) => sum + (doc.total || 0), 0)
      };
    } catch (error) {
      console.error('Error searching documents by date:', error);
      return {
        documents: [],
        summary: 'Ralat semasa mencari dokumen',
        error: error.message
      };
    }
  }

  // Get top customers
  async getTopCustomers(args, context = {}) {
    try {
      const { sortBy = 'revenue', limit = 10, timeframe = 'all' } = args;
      
      let dateFilter = {};
      if (timeframe === 'last_30_days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
      } else if (timeframe === 'this_year') {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        dateFilter = { createdAt: { $gte: startOfYear } };
      }

      const invoices = await Invoice.find({
        ...dateFilter,
        documentType: 'invoice'
      });

      // Group by customer
      const customerData = {};
      invoices.forEach(invoice => {
        const customer = invoice.clientName;
        if (!customerData[customer]) {
          customerData[customer] = {
            name: customer,
            revenue: 0,
            count: 0,
            lastInvoice: null
          };
        }
        customerData[customer].revenue += invoice.total || 0;
        customerData[customer].count += 1;
        if (!customerData[customer].lastInvoice || invoice.createdAt > customerData[customer].lastInvoice) {
          customerData[customer].lastInvoice = invoice.createdAt;
        }
      });

      // Sort customers
      let sortedCustomers = Object.values(customerData);
      if (sortBy === 'revenue') {
        sortedCustomers.sort((a, b) => b.revenue - a.revenue);
      } else if (sortBy === 'count') {
        sortedCustomers.sort((a, b) => b.count - a.count);
      } else if (sortBy === 'recent') {
        sortedCustomers.sort((a, b) => b.lastInvoice - a.lastInvoice);
      }

      const topCustomers = sortedCustomers.slice(0, limit);
      
      let summary = `Top ${limit} pelanggan berdasarkan ${sortBy}:\n`;
      topCustomers.forEach((customer, index) => {
        summary += `${index + 1}. ${customer.name} - RM${customer.revenue.toLocaleString()} (${customer.count} invois)\n`;
      });

      return {
        customers: topCustomers,
        summary,
        totalCustomers: Object.keys(customerData).length
      };
    } catch (error) {
      console.error('Error getting top customers:', error);
      return {
        customers: [],
        summary: 'Ralat semasa mendapatkan pelanggan terbaik',
        error: error.message
      };
    }
  }

  // Get revenue forecast
  async getRevenueForecast(args, context = {}) {
    try {
      const { months = 3, confidence = 'moderate' } = args;
      
      // Get last 6 months of data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);

      const invoices = await Invoice.find({
        createdAt: { $gte: startDate, $lte: endDate },
        documentType: 'invoice'
      }).sort({ createdAt: 1 });

      // Calculate monthly revenue
      const monthlyRevenue = {};
      invoices.forEach(invoice => {
        const month = invoice.createdAt.toISOString().substring(0, 7);
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (invoice.total || 0);
      });

      const revenueValues = Object.values(monthlyRevenue);
      const avgRevenue = revenueValues.reduce((sum, val) => sum + val, 0) / revenueValues.length;
      
      // Calculate trend
      let trend = 0;
      if (revenueValues.length > 1) {
        const firstHalf = revenueValues.slice(0, Math.floor(revenueValues.length / 2));
        const secondHalf = revenueValues.slice(Math.floor(revenueValues.length / 2));
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        trend = (secondAvg - firstAvg) / firstAvg;
      }

      // Apply confidence multiplier
      const confidenceMultiplier = {
        conservative: 0.8,
        moderate: 1.0,
        optimistic: 1.2
      }[confidence];

      const forecast = [];
      for (let i = 1; i <= months; i++) {
        const projectedRevenue = avgRevenue * (1 + trend * i) * confidenceMultiplier;
        const month = new Date();
        month.setMonth(month.getMonth() + i);
        forecast.push({
          month: month.toISOString().substring(0, 7),
          projectedRevenue: Math.round(projectedRevenue)
        });
      }

      const totalForecast = forecast.reduce((sum, f) => sum + f.projectedRevenue, 0);
      
      let summary = `Ramalan pendapatan ${months} bulan (${confidence}):\n`;
      forecast.forEach(f => {
        summary += `• ${f.month}: RM${f.projectedRevenue.toLocaleString()}\n`;
      });
      summary += `• Jumlah: RM${totalForecast.toLocaleString()}`;

      return {
        forecast,
        summary,
        totalForecast,
        avgMonthlyRevenue: avgRevenue,
        trend
      };
    } catch (error) {
      console.error('Error getting revenue forecast:', error);
      return {
        forecast: [],
        summary: 'Ralat semasa membuat ramalan pendapatan',
        error: error.message
      };
    }
  }

  // Get overdue analysis
  async getOverdueAnalysis(args, context = {}) {
    try {
      const { includeSuggestions = true, groupBy = 'customer' } = args;
      
      const today = new Date();
      const overdueInvoices = await Invoice.find({
        documentType: 'invoice',
        status: 'overdue',
        dueDate: { $lt: today }
      });

      let analysis = {};
      let totalOverdue = 0;

      overdueInvoices.forEach(invoice => {
        const daysOverdue = Math.floor((today - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
        const overdueAmount = invoice.total - (invoice.amountPaid || 0);
        totalOverdue += overdueAmount;

        if (groupBy === 'customer') {
          const customer = invoice.clientName;
          if (!analysis[customer]) {
            analysis[customer] = { count: 0, amount: 0, maxDays: 0 };
          }
          analysis[customer].count += 1;
          analysis[customer].amount += overdueAmount;
          analysis[customer].maxDays = Math.max(analysis[customer].maxDays, daysOverdue);
        } else if (groupBy === 'days_overdue') {
          const range = daysOverdue <= 30 ? '1-30 hari' : 
                       daysOverdue <= 60 ? '31-60 hari' : 
                       daysOverdue <= 90 ? '61-90 hari' : '90+ hari';
          if (!analysis[range]) {
            analysis[range] = { count: 0, amount: 0 };
          }
          analysis[range].count += 1;
          analysis[range].amount += overdueAmount;
        }
      });

      let summary = `Analisis invois tertunggak:\n`;
      summary += `• Jumlah invois: ${overdueInvoices.length}\n`;
      summary += `• Jumlah tertunggak: RM${totalOverdue.toLocaleString()}\n\n`;

      Object.entries(analysis).forEach(([key, data]) => {
        summary += `• ${key}: ${data.count} invois, RM${data.amount.toLocaleString()}\n`;
      });

      if (includeSuggestions) {
        summary += `\n💡 Cadangan:\n`;
        summary += `• Hubungi pelanggan dengan invois tertunggak > 30 hari\n`;
        summary += `• Pertimbangkan caj faedah untuk invois lama\n`;
        summary += `• Tawarkan pelan pembayaran untuk jumlah besar`;
      }

      return {
        analysis,
        summary,
        totalOverdue,
        overdueCount: overdueInvoices.length
      };
    } catch (error) {
      console.error('Error getting overdue analysis:', error);
      return {
        analysis: {},
        summary: 'Ralat semasa menganalisis invois tertunggak',
        error: error.message
      };
    }
  }

  // Get business insights
  async getBusinessInsights(args, context = {}) {
    try {
      const { focus = 'revenue', includeRecommendations = true } = args;
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);

      const invoices = await Invoice.find({
        createdAt: { $gte: startDate, $lte: endDate },
        documentType: 'invoice'
      });

      const quotes = await Invoice.find({
        createdAt: { $gte: startDate, $lte: endDate },
        documentType: 'quote'
      });

      let insights = '';
      let recommendations = '';

      if (focus === 'revenue') {
        const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const avgInvoiceValue = totalRevenue / invoices.length;
        const paidInvoices = invoices.filter(inv => inv.status === 'paid');
        const paymentRate = (paidInvoices.length / invoices.length) * 100;

        insights = `Pandangan Pendapatan (6 bulan):\n`;
        insights += `• Jumlah pendapatan: RM${totalRevenue.toLocaleString()}\n`;
        insights += `• Purata nilai invois: RM${avgInvoiceValue.toFixed(2)}\n`;
        insights += `• Kadar pembayaran: ${paymentRate.toFixed(1)}%\n`;
        insights += `• Jumlah invois: ${invoices.length}`;

        if (includeRecommendations) {
          recommendations = `\n💡 Cadangan Pendapatan:\n`;
          if (paymentRate < 80) {
            recommendations += `• Tingkatkan kadar pembayaran dengan mengikuti invois\n`;
          }
          if (avgInvoiceValue < 1000) {
            recommendations += `• Pertimbangkan meningkatkan nilai purata invois\n`;
          }
          recommendations += `• Tawarkan diskaun untuk pembayaran awal\n`;
          recommendations += `• Pertimbangkan sistem deposit untuk projek besar`;
        }
      } else if (focus === 'customers') {
        const uniqueCustomers = new Set(invoices.map(inv => inv.clientName));
        const customerRevenue = {};
        invoices.forEach(inv => {
          customerRevenue[inv.clientName] = (customerRevenue[inv.clientName] || 0) + (inv.total || 0);
        });

        insights = `Pandangan Pelanggan (6 bulan):\n`;
        insights += `• Jumlah pelanggan unik: ${uniqueCustomers.size}\n`;
        insights += `• Jumlah invois: ${invoices.length}\n`;
        insights += `• Purata invois per pelanggan: ${(invoices.length / uniqueCustomers.size).toFixed(1)}\n`;

        if (includeRecommendations) {
          recommendations = `\n💡 Cadangan Pelanggan:\n`;
          recommendations += `• Fokus pada pelanggan dengan nilai tinggi\n`;
          recommendations += `• Tawarkan pakej untuk pelanggan tetap\n`;
          recommendations += `• Minta rujukan dari pelanggan yang puas\n`;
          recommendations += `• Analisis pelanggan yang tidak aktif`;
        }
      }

      return {
        insights,
        recommendations,
        summary: insights + recommendations
      };
    } catch (error) {
      console.error('Error getting business insights:', error);
      return {
        insights: '',
        recommendations: '',
        summary: 'Ralat semasa mendapatkan pandangan perniagaan',
        error: error.message
      };
    }
  }

  // Get document statistics
  async getDocumentStats(args, context = {}) {
    try {
      const { documentType = 'all', timeframe = 'all' } = args;
      
      let dateFilter = {};
      if (timeframe === 'last_30_days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
      } else if (timeframe === 'this_year') {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        dateFilter = { createdAt: { $gte: startOfYear } };
      }

      const query = { ...dateFilter };
      if (documentType !== 'all') {
        query.documentType = documentType;
      }

      const documents = await Invoice.find(query);
      
      const stats = {
        total: documents.length,
        invoices: documents.filter(d => d.documentType === 'invoice').length,
        quotes: documents.filter(d => d.documentType === 'quote').length,
        totalAmount: documents.reduce((sum, doc) => sum + (doc.total || 0), 0),
        paid: documents.filter(d => d.status === 'paid').length,
        overdue: documents.filter(d => d.status === 'overdue').length,
        draft: documents.filter(d => d.status === 'draft').length
      };

      let summary = `Statistik Dokumen (${timeframe}):\n`;
      summary += `• Jumlah dokumen: ${stats.total}\n`;
      summary += `• Invois: ${stats.invoices}\n`;
      summary += `• Sebut Harga: ${stats.quotes}\n`;
      summary += `• Jumlah nilai: RM${stats.totalAmount.toLocaleString()}\n`;
      summary += `• Dibayar: ${stats.paid}\n`;
      summary += `• Tertunggak: ${stats.overdue}\n`;
      summary += `• Draf: ${stats.draft}`;

      return {
        stats,
        summary
      };
    } catch (error) {
      console.error('Error getting document stats:', error);
      return {
        stats: {},
        summary: 'Ralat semasa mendapatkan statistik dokumen',
        error: error.message
      };
    }
  }
}

module.exports = GroqMCPServer;
