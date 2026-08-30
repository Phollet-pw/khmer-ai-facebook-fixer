// backend/routes/aiChat.js
const express = require('express');
const router = express.Router();
const { Ollama } = require('ollama');

// ភ្ជាប់ទៅកាន់ Ollama លេខ Port ស្តង់ដារលើម៉ាស៊ីនបង
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

// កំណត់ចរិតលក្ខណៈ AI ឲ្យចេះលក់កញ្ចប់ និងពន្យល់ប្រព័ន្ធ Khmer AI
const KHMER_AI_MERCHANT_PROMPT = `
អ្នកគឺជាជំនួយការលក់ស្វ័យប្រវត្តរបស់ប្រព័ន្ធ "Khmer AI ជំនួយការជួសជុលហ្វេសប៊ុក"។
ភារកិច្ចរបស់អ្នក៖
១. ឆ្លើយតបជាភាសាខ្មែរជានិច្ច ដោយប្រើសម្តីរាក់ទាក់ ផ្អែមល្ហែម សុភាពរាបសារ (ប្រើពាក្យ "បាទ/ចាស" ឬ "បង")។
២. ណែនាំកញ្ចប់តម្លៃ៖ Basic $9 (1 credit), Standard $15 (2 credits), Pro $21 (3 credits), VIP $29 (5 credits)។
៣. ពន្យល់ពីសុវត្ថិភាព៖ ធានាជូន ១០០% ថាប្រព័ន្ធយើងមិនស្នើសុំ Password, OTP, Cookie ឬ Token ពី Facebook ឡើយ។
៤. ពន្យល់ប្រព័ន្ធអូតូ៖ គ្រាន់តែស្កេនវេរលុយឲ្យចំចំនួនទឹកប្រាក់មានក្បៀស នោះប្រព័ន្ធនឹងបញ្ចូលក្រេឌីតឲ្យអូតូក្នុង ៥ វិនាទី។
៥. ឆ្លើយតបខ្លីៗ ខ្លឹមសារចំចំណុច មិនវែងអន្លាយពេកឡើយ។
`;

// API សម្រាប់ទទួលសំណួរពី Frontend
router.post('/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    const p = (prompt || '').toLowerCase();
if (p.match(/payment|payout|billing|aba|acleda|qr|bank|price|package|តម្លៃ|បង់ប្រាក់|ទូទាត់|បង់លុយ|ចង់បង់|របៀបបង់|បង់តាមណា|ស្កេន|QR|ABA|ACLEDA|ធនាគារ|កញ្ចប់|សេវាកម្ម|ថ្លៃប៉ុន្មាន|តម្លៃប៉ុន្មាន/)) {
  return res.json({
    success: true,
    reply: `បានបង 🙏

សម្រាប់ការបង់សេវា Khmer AI សូមចុច Link ឬស្កេន QR ខាងក្រោម៖

🏦 ABA / ACLEDA QR
🔗 https://link.payway.com.kh/de4467234
💰 តម្លៃ Package:
• Basic $9
• Standard $15
• Pro $21
• VIP $29

ក្រោយបង់រួច សូមផ្ញើមកវិញ៖
1. Slip បង់ប្រាក់
2. Link Facebook Page
3. Package ដែលបងចង់ប្រើ

ក្រុមការងារ Khmer AI នឹងពិនិត្យ និងផ្ញើ Access Code ឲ្យភ្លាមៗ ✅
សូមអរគុណបង 🙏`
});
  }
    if (!prompt) {
      return res.status(400).json({ success: false, message: "សូមបញ្ចូលសំណួរ" });
    }

    // ហៅទៅកាន់ម៉ូដែល Llama 3.2 ដែលបងរត់ក្នុង Ollama
    const response = await ollama.chat({
      model: 'llama3.2:1b', // បងអាចដូរទៅ llama3.2:3b បានបើម៉ាស៊ីនរ៉េមធំ
      messages: [
        { role: 'system', content: KHMER_AI_MERCHANT_PROMPT },
        { role: 'user', content: prompt }
      ]
    });

    // ផ្ញើចម្លើយដែលចេញពីម៉ាស៊ីន AI របស់យើងទៅកាន់មុខផ្ទះវិញ
    res.json({
      success: true,
      reply: response.message.content
    });

  } catch (error) {
    console.error("Ollama Chat Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "ជំនួយការ AI កំពុងរវល់រៀបចំទិន្នន័យ សូមព្យាយាមម្តងទៀតបន្តិចទៀតនេះបង!" 
    });
  }
});

module.exports = router;