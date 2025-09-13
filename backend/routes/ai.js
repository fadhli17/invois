const express = require('express');
const router = express.Router();
const GroqMCPServer = require('../mcp/groq-mcp-server');
const auth = require('../middleware/auth');

// Initialize MCP Server
const mcpServer = new GroqMCPServer();

// Process AI message
router.post('/process', auth, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message diperlukan'
      });
    }

    // Get user context
    const userContext = {
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.fullName,
      ...context
    };

    // Process message with MCP Server
    const result = await mcpServer.process(message, userContext);

    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Process Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa memproses permintaan AI',
      error: error.message
    });
  }
});

// Get AI suggestions
router.get('/suggestions', auth, async (req, res) => {
  try {
    const suggestions = [
      {
        id: 'create_invoice',
        title: 'Buat Invois Baru',
        description: 'Buat invois untuk pelanggan baru',
        example: 'Buat invois untuk Ahmad Sdn Bhd dengan 2 laptop RM3000 setiap satu',
        icon: '📄'
      },
      {
        id: 'view_invoices',
        title: 'Lihat Invois',
        description: 'Lihat senarai invois',
        example: 'Tunjukkan semua invois yang belum dibayar',
        icon: '📋'
      },
      {
        id: 'customer_info',
        title: 'Maklumat Pelanggan',
        description: 'Cari maklumat pelanggan',
        example: 'Cari pelanggan Ahmad atau ABC Company',
        icon: '👥'
      },
      {
        id: 'analytics',
        title: 'Analisis & Laporan',
        description: 'Lihat analisis dan statistik',
        example: 'Berapa jumlah jualan bulan ini?',
        icon: '📊'
      }
    ];

    res.json({
      success: true,
      suggestions: suggestions
    });

  } catch (error) {
    console.error('AI Suggestions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mendapatkan cadangan AI',
      error: error.message
    });
  }
});

// Test AI connection
router.get('/test', auth, async (req, res) => {
  try {
    const testMessage = 'Hello, can you help me with invoices?';
    const result = await mcpServer.process(testMessage, { userId: req.user.id });

    res.json({
      success: true,
      message: 'AI connection berjaya!',
      testResult: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Test Error:', error);
    res.status(500).json({
      success: false,
      message: 'AI connection gagal',
      error: error.message
    });
  }
});

// Get AI chat history (optional)
router.get('/history', auth, async (req, res) => {
  try {
    // In a real implementation, you would store chat history in database
    const history = [
      {
        id: '1',
        message: 'Buat invois untuk Ahmad dengan 2 laptop',
        response: 'Invois #INV-001 telah dibuat untuk Ahmad Sdn Bhd!',
        timestamp: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      history: history
    });

  } catch (error) {
    console.error('AI History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat semasa mendapatkan sejarah chat',
      error: error.message
    });
  }
});

module.exports = router;