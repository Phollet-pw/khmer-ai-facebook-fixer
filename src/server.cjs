const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // สำหรับทำระบบ Login
const fs = require('fs');
const path = require('path');
const app = express();

const paymentsFile = path.join(__dirname, '../payments.json');

function savePayment(record) {
  let payments = [];

  if (fs.existsSync(paymentsFile)) {
    payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
  }

  payments.push(record);
  fs.writeFileSync(paymentsFile, JSON.stringify(payments, null, 2));
}

// ==========================================
// 1. Stripe Webhook (ត្រូវនៅមុន express.json)
// ==========================================
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userEmail = session.customer_details.email;
    const planId = session.metadata.planId;
    console.log(`✅ Payment success for ${userEmail}, Plan: ${planId}`);
  }

  res.json({ received: true });
});

// ==========================================
// 2. Global Middlewares (ត្រូវដាក់ត្រង់នេះ!)
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 3. Stripe Checkout Session Endpoint
// ==========================================
app.post('/api/create-checkout-session', async (req, res) => {
 const { planId } = req.body;
  const cleanPlanId = planId ? String(planId).toLowerCase() : '';

  const priceMap = {
    basic: process.env.STRIPE_PRICE_BASIC,
    standard: process.env.STRIPE_PRICE_STANDARD,
    pro: process.env.STRIPE_PRICE_PRO
  };

  const selectedPriceId = priceMap[cleanPlanId];
  if (!selectedPriceId) {
    return res.status(400).json({ error: 'Invalid plan selected' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: selectedPriceId, quantity: 1 }],
      metadata: { planId },
      success_url: `${req.headers.origin}/?payment=success`,
      cancel_url: `${req.headers.origin}/?payment=cancelled`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
  return null;
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
        const token = jwt.sign({ username }, process.env.JWT_SECRET || 'mysecretkey', { expiresIn: '7d' });
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

// ===== Facebook OAuth Login Flow =====

const FB_APP_ID = process.env.FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;
const FB_REDIRECT_URI = 'https://khmer-ai-facebook-fixer-udcm.onrender.com/api/facebook/callback';
const SECRET = process.env.JWT_SECRET || 'mysecretkey';

// ជំហានទី 1: ចាប់ផ្តើម login — redirect ភ្ញៀវទៅ Facebook
app.get('/api/facebook/login', (req, res) => {
  const fbLoginUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
    `client_id=${FB_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(FB_REDIRECT_URI)}` +
    `&scope=public_profile,email,pages_show_list` +
    `&response_type=code`;

  res.redirect(fbLoginUrl);
});

// ជំហានទី 2: Facebook redirect ត្រឡប់មកទីនេះជាមួយ authorization code
app.get('/api/facebook/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect('/?fb_error=login_cancelled');
  }
  if (!code) {
    return res.redirect('/?fb_error=no_code');
  }

  try {
    // ជំហានទី 3: ដូរ authorization code ជា access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${FB_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(FB_REDIRECT_URI)}` +
      `&client_secret=${FB_APP_SECRET}` +
      `&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('FB token error:', tokenData.error);
      return res.redirect('/?fb_error=token_exchange_failed');
    }

    const accessToken = tokenData.access_token;

    // ជំហានទី 4: ទាញព័ត៌មានប្រវត្តិរូបភ្ញៀវ
    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
    );
    const profile = await profileRes.json();

    // ជំហានទី 5: ទាញ Pages ដែលភ្ញៀវគ្រប់គ្រង
    const pagesRes = await fetch(
      `https://graph.facebook.com/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();

    // បង្កើត session token (JWT) សម្រាប់ភ្ញៀវ
    const sessionToken = jwt.sign(
      {
        fbId: profile.id,
        name: profile.name,
        email: profile.email || null,
        pages: pagesData.data || []
      },
      process.env.JWT_SECRET || 'mysecretkey',
      { expiresIn: '7d' }
    );

    res.redirect(`/?fb_login=success&token=${sessionToken}`);

  } catch (err) {
    console.error('Facebook OAuth error:', err.message);
    res.redirect('/?fb_error=server_error');
  }
});

// ជំហានទី 6: Endpoint ផ្ទៀងផ្ទាត់ token និងទាញព័ត៌មានភ្ញៀវ
app.get('/api/facebook/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token' });

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
    res.json({ success: true, user: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
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