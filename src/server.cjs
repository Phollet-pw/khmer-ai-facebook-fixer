const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // สำหรับทำระบบ Login
const fs = require('fs');
const path = require('path');

const paymentsFile = path.join(__dirname, '../payments.json');

function savePayment(record) {
  let payments = [];

  if (fs.existsSync(paymentsFile)) {
    payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
  }

  payments.push(record);
  fs.writeFileSync(paymentsFile, JSON.stringify(payments, null, 2));
}

const SECRET = 'your-secret-key-here'; // คีย์ล็อกรหัส Token

const app = express();

app.use(cors());
app.use(express.json());

const KHMER_AI_SYSTEM_PROMPT = `
អ្នកគឺជាជំនួយការលក់ស្វ័យប្រវត្តរបស់ប្រព័ន្ធ "Khmer AI ជំនួយការជួសជុលហ្វេសប៊ុក"។
ភារកិច្ចរបស់អ្នក៖
១. ឆ្លើយតបជាភាសាខ្មែរជានិច្ច ដោយប្រើសម្តីរាក់ទាក់ ផ្អែមល្ហែម សុភាពរាបសារ (ប្រើពាក្យ "បាទ/ចាស" ឬ "បង")។
២. ណែនាំកញ្ចប់តម្លៃ៖ Basic $9 (1 credit), Standard $15 (2 credits), Pro $21 (3 credits), VIP $29 (5 credits)។
៣. ពន្យល់ពីសុវត្ថិភាព៖ ធានាជូន ១០០% ថាប្រព័ន្ធយើងមិនស្នើសុំ Password, OTP, Cookie ឬ Token ពី Facebook ឡើយ។
៤. ពន្យល់ប្រព័ន្ធអូតូ៖ គ្រាន់តែស្កេនវេរលុយឲ្យចំចំនួនទឹកប្រាក់មានក្បៀស នោះប្រព័ន្ធនឹងបញ្ចូលក្រេឌីតឲ្យអូតូក្នុង ៥ វិនាទី។
៥. ឆ្លើយតបខ្លីៗ ខ្លឹមសារចំចំណុច មិនវែងអន្លាយពេកឡើយ។
`;

function getKeywordFallback(prompt) {
  const p = (prompt || '').toLowerCase();

  if (p.match(/payment|payout|billing|aba|acleda|qr|bank|វេរលុយ|ទូទាត់|ប្រាក់|โอน|จ่าย|ธนาคาร/)) {
    return `បាទ! ខ្ញុំជួយពន្យល់ការទូទាត់ (ព័ត៌មានអូតូ) 💳\n\n` +
      `១. វេរប្រាក់ ABA / ACLEDA ឲ្យចំចំនួន (ត្រូវតែមានក្បៀស ដូចជា $9.00)\n` +
      `២. ប្រព័ន្ធស្កេន QR Code ឬ Transfer Slip ដោយស្វ័យប្រវត្ត\n`+
      `៣. ក្រេឌីតចូលក្នុងរយៈពេល ៥ វិនាទី ក្រោយការទូទាត់\n` +
      `៤. ប្រសិនបើក្រេឌីតមិនទាន់ចូល សូម Inbox Facebook "Khmer AI" ផ្ទេរ Slip\n\n` +
      `📱 Khmer AI: https://www.facebook.com/profile.php?id=61567580101437`;
  }

  if (p.match(/monetization|ប្រាក់ចំណូល|earn|revenue|partner|creator|monetis|รายได้|สร้างรายได้/)) {
    return `បាទ! ខ្ញុំជួយបញ្ហា Monetization 💰\n\n` +
      `១. ចូល Page → More → Page Quality → ពិនិត្យ violations\n` +
      `២. ដក content ដែលបំពានចេញភ្លាមៗ\n` +
      `៣. ចូល Creator Studio → Monetization → Request Review\n` +
      `៤. រង់ចាំ ១-២ សប្តាហ៍ ហើយ Meta នឹងឆ្លើយ\n` +
      `៥. ប្រើ Khmer AI វិភាគស្ថានភាព Monetization របស់ Page (ទិញ Credit ១ ដង)\n\n` +
      `💡 Tip: ផ្ទុកចំណូល reel/video ច្រើន ចំនួន watch time ត្រូវ 600,000+ minutes;`;
  }

  if (p.match(/page restrict|restricted|page quality|ban|disable|blocked|ហ្វេសប៊ុក|ផេក|page|ถูกจำกัด|โดนแบน/)) {
    return `បាទ! ខ្ញុំជួយបញ្ហា Page Restricted 🔒\n\n` +
      `១. ចូល facebook.com/help/contact → ជ្រើស "Page Restricted"\n` +
      `២. Upload ID Card (ប័ណ្ណអត្តសញ្ញាណ) ប្រសិនបើ Meta ស្នើ\n` +
      `៣. ពន្យល់ច្បាស់ថា Page របស់បងផ្ញើ content អ្វី\n`+
      `៤. រង់ចាំ ២-៥ ថ្ងៃ ហើយ Meta review\n` +
      `៥. ប្រើ Khmer AI Generate Appeal Letter ដែលជួយ ៩០% 🎯\n\n` +
      `⚠️ ហៅ Meta Support: 1-650-543-4800 (ប្រសិនបើ severe)`;
  }

  if (p.match(/ad account|ads|advertising|campaign|ad reject|boost|business manager|โฆษณา|บัญชีโฆษณา/)) {
    return `បាទ! ខ្ញុំជួយបញ្ហា Ad Account 📛\n\n` +
      `១. ចូល business.facebook.com → Account Quality\n` +
      `២. ចុច "Request Review" លើ Ad Account ដែលត្រូវបាន Restrict\n` +
      `៣. ធ្វើ Payment Method ឲ្យ Valid (ប្រើ Visa/Mastercard)\n` +
      `៤. ពិនិត្យ Ad Policy ហើយ resubmit ad ដោយ fix content\n` +
      `៥. ប្រើ Khmer AI ដើម្បីវិភាគហេតុ ad rejected 🤖\n\n` +
      `📋 Facebook Ads Policy: https://www.facebook.com/business/help/2032702440326605`;
  }

  if (p.match(/access code|credit|code|client|ក្រេឌីត|kcredit|รหัส|เครดิต/)) {
    return `បាទ! ខ្ញុំជួយពន្យល់ Access Code & Credit ✨\n\n` +
      `📦 កញ្ចប់តម្លៃ:\n` +
      `• Basic $9 → 1 Credit (វិភាគ 1 ដង)\n` +
      `• Standard $15 → 2 Credits\n` +
      `• Pro $21 → 3 Credits ⭐️\n` +
      `• VIP $29 → 5 Credits\n` +
      `• Business $39 → 8 Credits\n` +
      `• Agency $59 → 15 Credits\n\n` +
      `🔑 របៀបប្រើ Access Code:\n` +
      `១. ទូទាត់ → ទទួល Code (ដូចជា CLIENT-001)\n` +
      `២. វាយ Code នៅទំព័រ Access Code\n` +
      `៣. ចុច Submit → Credit ចូលភ្លាម\n` +
      `៤.
      ប្រើ Credit វិភាគ Facebook Page/Profile`;
  }

  return `សួស្តីបង! 🤖 ខ្ញុំ AI ជំនួយការ Khmer AI。\n\n` +
    `ខ្ញុំអាចជួយបង:\n` +
    `• 💰 បញ្ហា Monetization\n` +
    `• 🔒 Page Restricted / Banned\n` +
    `• 📛 Ad Account ត្រូវបានកំណត់\n` +
    `• 💳 Payment & Credit\n` +
    `• 🔑 Access Code & Pricing\n\n` +
    `សូមសួរពីបញ្ហាជាក់លាក់ ខ្ញុំ នឹងជួយបង! 😊`;
}

app.post('/api/ai/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ success: false, message: 'សូមបញ្ចូលសំណួរ' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const ollamaRes = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        messages: [
          { role: 'system', content: KHMER_AI_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timer);
    const data = await ollamaRes.json();
    res.json({ success: true, reply: data.message.content });
  } catch (error) {
    clearTimeout(timer);
    const isTimeout = error.name === 'AbortError';
    console.error(isTimeout ? 'Ollama timeout (10s)' : 'Ollama Chat Error:', error.message);
    const fallback = getKeywordFallback(prompt);
    res.json({ success: true, reply: fallback, fallback: true });
  }
});

// 1. ปุ่ม Login สำหรับรับ Token
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '1234') {
        const token = jwt.sign({ username }, SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token });
    }
    res.status(401).json({ success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
});

// 2. ปุ่ม AI Analyze
app.post('/api/analyze', async (req, res) => {
    const { pageName, category, followers, selectedProblem, description } = req.body;

    const prompt = `Analyze Facebook Page issue: Name ${pageName}, Category ${category}, Followers ${followers}. Problem: ${selectedProblem}. Description: ${description}. Provide English and Khmer appeal message.`;

    try {
        const aiResponse = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: "khmer_ai_user",
                message: prompt
            })
        });
        const aiData = await aiResponse.json();
        res.json({ 
            success: true, 
            result: aiData.reply ||  aiData.message||  aiData 
        });

    } catch (error) {
        res.status(500).json({ success: false, error: "ติดต่อ AI Server พอร์ต 5000 ไม่ได้ครับ" });
    }
});

// Auto Payment Webhook
app.post('/api/webhook/payment', (req, res) => {
  const { customerName, pageLink, packageName, amount, txId } = req.body;

  if (!customerName || !pageLink || !packageName || !amount || !txId) {
    return res.status(400).json({
      success: false,
      message: 'Missing payment data'
    });
  }

  const code = `KA-${packageName.toUpperCase()}-${Date.now().toString().slice(-6)}`;

  const paymentRecord = {
    customerName,
    pageLink,
    packageName,
    amount,
    txId,
    status: 'paid',
    accessCode: code,
    createdAt: new Date()
  };

  savePayment(paymentRecord);

  console.log('✅ Payment approved:', paymentRecord);

  res.json({
    success: true,
    message: 'Payment approved automatically',
    accessCode: code,
    data: paymentRecord
  });
});

app.post('/api/verify-code', (req, res) => {
  const { accessCode } = req.body;

  if (!accessCode) {
    return res.status(400).json({
      success: false,
      message: 'Missing access code'
    });
  }

  let payments = [];

  if (fs.existsSync(paymentsFile)) {
    payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
  }

  const user = payments.find(p => p.accessCode === accessCode && p.status === 'paid');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid access code'
    });
  }

  res.json({
    success: true,
    message: 'Access granted',
    user
  });
});



app.get("/api-health", (req, res) => {
  res.send("Khmer AI Backend is running");
});

// Facebook Login API
app.post('/api/facebook/login', async (req, res) => {
  const { accessToken } = req.body;

  try {
    const fbResponse = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${accessToken}`);
    const fbData = await fbResponse.json();

    if (fbData.error) {
      return res.status(400).json({ success: false, error: fbData.error.message });
    }

    const port = process.env.PORT || 5000;
    const aiResponse = await fetch(`http://localhost:${port}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: fbData.name,
        message: `Analyze account issues for email: ${fbData.email}`
      })
    });

    const aiData = await aiResponse.json();

    res.json({
      success: true,
      user: fbData,
      aiAnalysis: aiData.result || aiData.reply
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// === 2. SERVE FRONTEND ===
app.use(express.static(path.join(__dirname, '../dist')));

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// === 3. START SERVER ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});