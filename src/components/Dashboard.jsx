import React, { useState } from 'react';

const Dashboard = ({ onLogout }) => {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'សួស្តី! តើខ្ញុំអាចជួយអ្វីបានខ្លះទាក់ទងនឹង Facebook Page របស់អ្នក?' }
  ]);

  const handleProblemClick = (problem) => {
    const userMsg = { role: 'user', text: ខ្ញុំចង់ដោះស្រាយបញ្ហា: ${problem} };
    const botMsg = { 
      role: 'bot', 
      text: ដំណោះស្រាយសម្រាប់ ${problem}៖\n១. សូមចូលទៅកាន់ Meta Business Suite ។\n២. ពិនិត្យមើល Security Center ថាតើមានការแจ้งเตือนដែរឬទេ។\n៣. បើមានបញ្ហា សូមចុចប៊ូតុង Appeal តាម Link ដែលប្រព័ន្ធផ្តល់ជូន។ 
    };
    setMessages(prev => [...prev, userMsg, botMsg]);
  };

  const problems = [
    "1. បញ្ហា Page at Risk", "2. បញ្ហា Monetization", "3. ជាប់គោលការណ៍ Copyright",
    "4. បញ្ហាជួសជុល Meta Business", "5. បញ្ហាការផ្សាយពាណិជ្ជកម្ម", "6. គណនី Facebook ជាប់កំណត់",
    "7. បញ្ហាដាក់លេខទូរស័ព្ទ", "8. បញ្ហាការចូលប្រើ Admin", "9. លុបវីដេអូដែលជាប់កំហុស", "10. ជំនួយបច្ចេកទេសទូទៅ"
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#111827', color: 'white' }}>
      {/* Sidebar */}
      <div style={{ width: '280px', backgroundColor: '#1f2937', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Khmer AI Menu</h2>
        <button style={{ padding: '10px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>+ បង្កើតគម្រោងថ្មី</button>
        
        <div style={{ flexGrow: 1, overflowY: 'auto', marginTop: '10px' }}>
          {problems.map((item, index) => (
            <button key={index} onClick={() => handleProblemClick(item)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#d1d5db', padding: '8px 0', cursor: 'pointer' }}>
              {item}
            </button>
          ))}
        </div>
        <button onClick={onLogout} style={{ padding: '10px', backgroundColor: '#ef4444', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>ចាកចេញ (Logout)</button>
      </div>

      {/* Chat Area */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: '15px', padding: '10px', backgroundColor: m.role === 'bot' ? '#374151' : '#2563eb', borderRadius: '8px', maxWidth: '80%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.text}
            </div>
          ))}
        </div>
        <input type="text" placeholder="វាយសំណួរនៅទីនេះ..." style={{ padding: '15px', borderRadius: '8px', border: 'none' }} />
      </div>
    </div>
  );
};

export default Dashboard;