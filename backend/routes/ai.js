const express = require('express');
const router = express.Router();
const GroqMCPServer = require('../mcp/groq-mcp-server');
// Using global fetch (Node 18+)

// Initialize MCP Server
const mcpServer = new GroqMCPServer();

// Generate Terms and Conditions via Groq (LLM)
router.post('/generate-terms', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'GROQ_API_KEY tidak ditetapkan. Sila set environment variable .' });
    }

    const { documentType = 'invoice', language = 'ms', notes = '', shorten = false } = req.body || {};

    const typeLabel = documentType === 'quote' ? 'Sebut Harga' : 'Invois';
    const baseConstraints = `Anda ialah penulis dokumen profesional dalam Bahasa Melayu.
Tugas: Hasilkan Terma dan Syarat ringkas untuk ${typeLabel} dalam ${shorten ? '1 hingga 3' : '1 hingga 5'} baris SAHAJA.
Syarat bentuk:
- Setiap baris bermula dengan nombor diikuti titik (contoh: 1., 2., 3.).
- Ayat ringkas, tepat, dan spesifik.
- Tiada tajuk, tiada baris kosong tambahan, tiada perenggan panjang.`;

    const quoteGuidelines = `Gaya & kandungan untuk Sebut Harga:
- Tegaskan ini bukan invois dan tiada bayaran diperlukan sehingga pengesahan/PO.
- Nyatakan tempoh sah laku sebut harga (contoh 14/30 hari) secara umum.
- Harga tertakluk kepada perubahan jika skop/keperluan berubah.
- Kerja hanya bermula selepas kelulusan bertulis/pesanan belian.
- Terma tertakluk kepada undang-undang Malaysia.`;

    const invoiceGuidelines = `Gaya & kandungan untuk Invois:
- Bayaran diperlukan dalam tempoh munasabah (contoh 7/14/30 hari) dari tarikh invois.
- Bayaran lewat boleh dikenakan caj/faedah lewat (nyatakan secara umum).
- Barang/servis dianggap diterima baik melainkan dimaklumkan dalam tempoh singkat.
- Tiada liabiliti atas kerugian tidak langsung; pindaan memerlukan persetujuan bertulis.
- Terma tertakluk kepada undang-undang Malaysia.`;

    const systemPrompt = [
      baseConstraints,
      documentType === 'quote' ? quoteGuidelines : invoiceGuidelines,
    ].join('\n');

    const userPrompt = `Butiran ringkas pengguna (jika ada): ${notes || '-'}
Keperluan tambahan:
- Bahasa: ${language === 'ms' ? 'Melayu' : language}
- Jenis: ${typeLabel}
- Hasil akhir: 1-5 baris bernombor (1., 2., 3., ...), ringkas tanpa tajuk.`;

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      throw new Error(`Groq error: ${resp.status} ${t}`);
    }
    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content || '';
    let terms = raw.trim();
    if (!terms) {
      return res.status(500).json({ message: 'Gagal menjana Terma dan Syarat.' });
    }
    // Normalize and hard-limit to max 5 lines (or 3 if shorten)
    const limit = shorten ? 3 : 5;
    const normalized = [];
    const roughLines = terms
      .split(/\r?\n+/)
      .map(l => l.trim())
      .filter(Boolean);
    for (const line of roughLines) {
      if (normalized.length >= limit) break;
      // Strip any existing bullets or numbering at the start
      const content = line.replace(/^\s*(?:\d+[)\.\-]|[•\-\*])\s*/, '').trim();
      if (!content) continue;
      normalized.push(content);
    }
    // Re-number 1..N and join
    if (normalized.length > 0) {
      terms = normalized.map((t, idx) => `${idx + 1}. ${t}`).join('\n');
    } else {
      // Fallback: take first sentence if model returned something odd
      const first = terms.split(/\r?\n+/).find(Boolean) || 'Syarat umum terpakai di bawah undang-undang Malaysia.';
      terms = `1. ${first.replace(/^\s*(?:\d+[)\.\-]|[•\-\*])\s*/, '').trim()}`;
    }

    res.json({ success: true, terms });
  } catch (error) {
    console.error('AI generate-terms error:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Ralat semasa menjana Terma dan Syarat.' });
  }
});

// AI Chat endpoint
router.post('/process', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message diperlukan' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID diperlukan' 
      });
    }

    const context = { userId };
    const result = await mcpServer.process(message, context);
    
    res.json({
      success: true,
      result
    });
    
  } catch (error) {
    console.error('AI process error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ralat semasa memproses permintaan AI' 
    });
  }
});

// Get AI suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = [
      "Berapa jumlah revenue yang dibayar sahaja?",
      "Tunjukkan semua invois yang tertunggak",
      "Buat invois baru untuk pelanggan",
      "Berapa sebut harga yang pending?",
      "Siapa pelanggan terbaik saya?",
      "Analisis invois bulan ini",
      "Tambah pelanggan baru"
    ];
    
    res.json({
      success: true,
      suggestions
    });
    
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ralat semasa mendapatkan suggestions' 
    });
  }
});

// Test AI connection
router.get('/test', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'GROQ_API_KEY tidak ditetapkan' 
      });
    }
    
    res.json({
      success: true,
      message: 'AI server berfungsi dengan baik',
      hasApiKey: true
    });
    
  } catch (error) {
    console.error('AI test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ralat semasa test AI connection' 
    });
  }
});

module.exports = router;
