import { useState } from 'react';

const Dashboard = ({ onLogout }) => {
  // គ្រប់គ្រងព័ត៌មាន User ( Google / Facebook )
  const [user, setUser] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'សួស្តី! ខ្ញុំជា Khmer AI ជំនួយការស្វ័យប្រវត្ត។ ខ្ញុំអាចជួយដោះស្រាយគ្រប់បញ្ហា Facebook របស់អ្នក (ទាំង Profile, Page, Ad Account, Monetization, Restriction, ផ្សេងៗ)។ តើអ្នកមានបញ្ហាអ្វីដែរ?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // មុខងារ Login ជាមួយ Google
  const handleGoogleLogin = () => {
    // ភ្ជាប់ជាមួយ Google OAuth / Firebase Auth តាមតម្រូវការ
    const mockGoogleUser = {
      name: 'Google User',
      email: 'user@gmail.com',
      provider: 'Google',
      avatar: 'https://cdn-icons-png.flaticon.com/512/300/300221.png'
    };
    setUser(mockGoogleUser);
  };

  // មុខងារ Login ជាមួយ Facebook
  const handleFacebookLogin = () => {
    // ភ្ជាប់ជាមួយ Facebook SDK (window.FB.login) តាមតម្រូវការ
    const mockFBUser = {
      name: 'Facebook User',
      email: 'user@facebook.com',
      provider: 'Facebook',
      avatar: 'https://cdn-icons-png.flaticon.com/512/5968/5968764.png'
    };
    setUser(mockFBUser);
  };

  const handleLogout = () => {
    setUser(null);
    if (onLogout) onLogout();
  };

  const sendMessage = async (customPrompt) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          userInfo: user ? { name: user.name, provider: user.provider } : null
        })
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: data.reply || 'សូមអភ័យទោស មិនអាចទទួលចម្លើយបានទេ។'
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'មានបញ្ហាក្នុងការភ្ជាប់ទៅ Server សូមសាកល្បងម្តងទៀត។'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

// មុខងារ Subscription និងទូទាត់ប្រាក់
const handleSubscribe = async (planId) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ planId }), // 'basic', 'standard', ឬ 'pro'
    });

    const data = await response.json();
    if (data.url) {
      // នាំអតិថិជនទៅកាន់ទំព័រទូទាត់ប្រាក់ StripeCheckout ដោយស្វ័យប្រវត្តិ
      window.location.href = data.url;
    } else {
      alert('មានបញ្ហាក្នុងការបង្កើតកន្លែងទូទាត់ប្រាក់៖ ' + (data.error || ''));
    }
  } catch (err) {
    console.error('Subscription Failed:', err);
    alert('មិនអាចភ្ជាប់ទៅកាន់ប្រព័ន្ធទូទាត់ប្រាក់បានទេ!');
  }
};

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#111827', color: 'white', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '280px', backgroundColor: '#1f2937', padding: '20px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #374151' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Khmer AI Facebook Fixer</h2>

        {/* ផ្នែក Login / Profile Status */}
        <div style={{ backgroundColor: '#374151', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={user.avatar} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{user.name}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#10b981' }}>✓ ភ្ជាប់តាម {user.provider}</p>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '13px', color: '#d1d5db', marginBottom: '10px' }}>ចូលប្រព័ន្ធដើម្បីទាញយកព័ត៌មានដោះស្រាយ៖</p>
              <button onClick={handleGoogleLogin} style={googleBtnStyle}>
                <img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="16" alt="G" />
                Sign in with Google
              </button>
              <button onClick={handleFacebookLogin} style={fbBtnStyle}>
                <img src="https://cdn-icons-png.flaticon.com/512/5968/5968764.png" width="16" alt="FB" />
                Sign in with Facebook
              </button>
            </div>
          )}
        </div>

        {/* ផ្នែកជ្រើសរើសកញ្ចប់សេវាកម្ម (Pricing Plans) */}
        <div style={{ backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold', color: '#f3f4f6' }}>
            💳 ជាវកញ្ចប់ប្រចាំខែ (Subscription)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => handleSubscribe('basic')}
              style={{ ...navBtn, backgroundColor: '#2563eb', color: 'white', textAlign: 'center' }}
            >
              ជាវកញ្ចប់ Basic ($6/ខែ)
            </button>
            <button 
              onClick={() => handleSubscribe('standard')}
              style={{ ...navBtn, backgroundColor: '#059669', color: 'white', textAlign: 'center' }}
            >
             ជាវកញ្ចប់ Standard ($15/ខែ)
            </button>
            <button 
            onClick={() => handleSubscribe('pro')}
            style={{ ...navBtn, backgroundColor: '#7c3aed', color: 'white', textAlign: 'center' }}
            >
              ជាវកញ្ចប់ Pro ($25/ខែ)
            </button>
        </div>
      </div>

        {/* ប្រវត្តិការងារ & បញ្ហាទូទៅ */}
        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
          <p style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>ជួយដោះស្រាយបញ្ហាឆាប់រហ័ស</p>
          <button onClick={() => sendMessage('ជួយដោះស្រាយបញ្ហា Profile ឬ Page ត្រូវគេ Restricted / Disabled')} style={quickOptionBtn}>
            🔒 Profile / Page Restricted
          </button>
          <button onClick={() => sendMessage('ជួយដោះស្រាយបញ្ហា Monetization (បាត់ចំណូល / ជាប់លឿង / ជាប់ក្រហម)')} style={quickOptionBtn}>
            💰 Monetization & Payout Issues
          </button>
          <button onClick={() => sendMessage('ជួយដោះស្រាយបញ្ហា Ad Account Disabled / Payment Rejected')} style={quickOptionBtn}>
            💳 Ad Account / Payment Problems
          </button>
          <button onClick={() => sendMessage('ជួយដោះស្រាយបញ្ហា Account ត្រូវគេ Hack ឬភ្លេចលេខសម្ងាត់/OTP')} style={quickOptionBtn}>
            🛡 Account Hacked / OTP Issue
          </button>
        </div>

        <button onClick={handleLogout} style={{ ...navBtn, backgroundColor: '#ef4444', marginTop: 'auto' }}>
          ចាកចេញ (Logout)
        </button>
      </div>

      {/* Main Chat Area */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Chat Messages */}
        <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                marginBottom: '15px',
                padding: '12px 16px',
                backgroundColor: m.role === 'bot' ? '#374151' : '#2563eb',
                borderRadius: '8px',
                maxWidth: '75%',
                marginLeft: m.role === 'user' ? 'auto' : '0',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.5'
              }}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div style={{ padding: '10px', color: '#9ca3af', fontSize: '14px', italic: 'true' }}>
              🤖 Khmer AI កំពុងវិភាគ និងស្វែងរកដំណោះស្រាយ...
            </div>
          )}
        </div>

        {/* Input Box */}
        <div style={{ padding: '20px', backgroundColor: '#1f2937', display: 'flex', gap: '10px', borderTop: '1px solid #374151' }}>
          {/* ប៊ូតុង 📷 🌄 🎙 */}
      <button 
        type="button" 
        onClick={() => alert('មុខងារថតរូប (Camera) កំពុងរៀបចំ...')}
        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '0 4px' }}
        title="ថតរូប"
      >
        📷
      </button>
      <button 
        type="button" 
        onClick={() => alert('មុខងារជ្រើសរូបភាព (Gallery) កំពុងរៀបចំ...')}
        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '0 4px' }}
        title="ជ្រើសរូបភាព"
      >
        🌄
      </button>
      <button 
        type="button" 
        onClick={() => alert('មុខងារថតសំឡេង (Voice) កំពុងរៀបចំ...')}
        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '0 4px' }}
        title="សារសំឡេង"
      >
        🎙
      </button>
          <input
            type="text"
            placeholder="រៀបរាប់ពីបញ្ហា Facebook របស់អ្នកនៅទីនេះ (Profile, Page, Ads, Security...)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flexGrow: 1, padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#374151', color: 'white', outline: 'none' }}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: loading ? '#6b7280' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            ផ្ញើ
          </button>
        </div>
      </div>
    </div>
  );
};

// Component Styles
const navBtn = {
  padding: '10px',
  backgroundColor: '#374151',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  width: '100%'
};

const googleBtnStyle = {
  width: '100%',
  padding: '8px',
  backgroundColor: '#ffffff',
  color: '#000',
  border: 'none',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontSize: '13px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginBottom: '8px'
};

const fbBtnStyle = {
  width: '100%',
  padding: '8px',
  backgroundColor: '#1877f2',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontSize: '13px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const quickOptionBtn = {
  width: '100%',
  textAlign: 'left',
  padding: '10px',
  backgroundColor: '#374151',
  color: '#e5e7eb',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  marginTop: '8px',
  cursor: 'pointer'
};

export default Dashboard;