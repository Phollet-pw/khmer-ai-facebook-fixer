import React, { useState } from 'react';

const Dashboard = ({ onLogout }) => {
  const [messages, setMessages] = useState([{ role: 'bot', text: 'សួស្តី! តើខ្ញុំអាចជួយអ្វីបានខ្លះទាក់ទងនឹង Facebook Page របស់អ្នក?' }]);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#111827', color: 'white' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', backgroundColor: '#1f2937', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
            <div key={i} style={{ marginBottom: '15px', padding: '10px', backgroundColor: m.role === 'bot' ? '#374151' : '#2563eb', borderRadius: '8px' }}>
              {m.text}
            </div>
          ))}
        </div>
        {/* Input Box */}
        <div style={{ padding: '20px', backgroundColor: '#1f2937' }}>
          <input 
            type="text" 
            placeholder="សួរសំណួររបស់អ្នកនៅទីនេះ..." 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none' }}
            onKeyDown={(e) => e.key === 'Enter' && setMessages([...messages, { role: 'user', text: e.target.value }])}
          />
        </div>
      </div>
    </div>
  );
};

const navBtn = { padding: '10px', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' };

export default Dashboard;