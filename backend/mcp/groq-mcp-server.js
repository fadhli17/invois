const { Groq } = require('groq-sdk');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

class GroqMCPServer {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    
    this.model = 'llama-3.1-8b-instant';
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
      throw new Error('Gagal memproses permintaan AI');
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
