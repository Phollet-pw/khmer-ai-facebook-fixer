import { useState } from 'react';

const Dashboard = ({ onLogout }) => {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'សូស្តី! តើខ្ញុំអចជួយអ្វីបានខ្លទាក់ទងនឹង Facebook Page របស់អ្នក?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentInput })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply || 'សូមអភ័យទោស មនអាចទទួលចម្លើយបានទេ' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'មានបញ្ហាក្នុងការភជាប់ទៅ server សូមសាកល្បងម្តងទៀត' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#111827', color: 'white' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', backgroundColor: '#1f2937', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '18px' }}>Khmer AI Menu</h2>
        <button style={navBtn}>+ បង្កើតគម្រោងថ្មី</button>
        <div style={{ flexGrow: 1 }}>
          <p style={{ color: '#9ca3af', fontSize: '12px' }}>ប្រវត្តិការងារ</p>
          <div style={{ fontSize: '14px', marginTop: '10px' }}>• ជួសជុល Page A</div>
          <div style={{ fontSize: '14px' }}>• បញ្ហា Monetization</div>
        </div>
        <button onClick={onLogout} style={{ ...navBtn, backgroundColor: '#ef4444' }}>ចាកចេញ (Logout)</button>
      </div>

      {/* Main Chat Area */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: '15px', padding: '10px', backgroundColor: m.role === 'bot' ? '#374151' : '#3b82f6', borderRadius: '8px', maxWidth: '70%', marginLeft: m.role === 'user' ? 'auto' : '0' }}>
              {m.text}
            </div>
          ))}
          {loading && (
            <div style={{ padding: '10px', color: '#9ca3af', fontSize: '14px' }}>កំពុងឆ្លើយតប...</div>
          )}
        </div>

        {/* Input Box */}
        <div style={{ padding: '20px', backgroundColor: '#1f2937', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="សូរសំណួររបស់អ្នកនៅទីនេះ..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flexGrow: 1, padding: '12px', borderRadius: '8px', border: 'none' }}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{ padding: '12px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            ផ្ញើ
          </button>
        </div>
      </div>
    </div>
  );
};

const navBtn = {
  padding: '10px',
  backgroundColor: '#374151',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  marginTop: '10px',
  marginBottom: '10px',
  cursor: 'pointer'
};

export default Dashboard;