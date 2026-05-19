import { useEffect, useRef, useState } from 'react';

const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:3000';

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const chatEndRef = useRef(null);
  const slowTimerRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        sender: 'ai',
        text: 'សួស្តីបង! ខ្ញុំជា AI ជំនួយការស្វ័យប្រវត្តរបស់ Khmer AI 🤖។ បងមានចម្ងល់ពីរបៀបទិញក្រេឌីត តម្លៃកញ្ចប់ ឬបញ្ហាសុវត្ថិភាពផេកមែនទេ? សួរខ្ញុំបានណា! ✨',
      },
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setIsLoading(true);
    setIsSlow(false);

    // Show "slow" warning after 6 seconds
    slowTimerRef.current = setTimeout(() => setIsSlow(true), 6000);

    const controller = new AbortController();
    // 12s frontend timeout (backend already aborts at 10s and returns fallback)
    const abortTimer = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText }),
        signal: controller.signal,
      });
      clearTimeout(abortTimer);
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.success
            ? data.reply
            : 'សូមអភ័យទោសបង ខ្ញុំដាច់ការភ្ជាប់ទៅកាន់ខួរក្បាលម៉ាស៊ីនបន្តិច។ សូមព្យាយាមម្តងទៀត!',
        },
      ]);
    } catch (err) {
      clearTimeout(abortTimer);
      const msg = err.name === 'AbortError'
        ? 'AI ឆ្លើយតបយ៉ាងយូរ 😓 សូមសួរម្តងទៀត ឬ Inbox Facebook "Khmer AI" ដើម្បីទទួលជំនួយ!'
        : 'មានបញ្ហាអ៊ីនធឺណិត 📡 សូមពិនិត្យ connection ហើយព្យាយាមម្តងទៀតណា!';
      setMessages((prev) => [...prev, { sender: 'ai', text: msg }]);
    } finally {
      clearTimeout(slowTimerRef.current);
      setIsLoading(false);
      setIsSlow(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, fontFamily: "'Kantumruy Pro', sans-serif" }}>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: 58, height: 58, borderRadius: '50%',
            background: 'linear-gradient(135deg,#1877F2,#0d5bbd)',
            border: 'none', color: '#fff', fontSize: 22,
            cursor: 'pointer', boxShadow: '0 4px 18px rgba(24,119,242,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Khmer AI Assistant"
        >
          💬
        </button>
      )}

      {isOpen && (
        <div style={{
          width: 340, height: 460,
          background: '#0f172a',
          borderRadius: 16,
          border: '1px solid #1e293b',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,.6)',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg,#1877F2,#0d5bbd)',
            padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#34c759', flexShrink: 0 }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Khmer AI Assistant · ២៤ម៉ោង</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.8)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, padding: '12px 14px',
            overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                <div style={{
                  background: msg.sender === 'user' ? 'linear-gradient(135deg,#1877F2,#0d5bbd)' : '#1e293b',
                  color: '#f1f5f9',
                  padding: '9px 13px',
                  borderRadius: msg.sender === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  fontSize: 13, lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ color: '#64748b', fontSize: 12 }}>
                  🤖 AI កំពុងវាយអត្ថបទ...
                </div>
                {isSlow && (
                  <div style={{
                    background: '#1e293b', color: '#fbbf24',
                    padding: '7px 11px', borderRadius: '10px 10px 10px 3px',
                    fontSize: 12, lineHeight: 1.4, maxWidth: 220,
                  }}>
                    ⏳ AI ដំណើរការយ៉ាងយូរបន្តិច... ខ្ញុំកំពុងរកចម្លើយល្អបំផុតជូនបង!
                  </div>
                )}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{
            padding: '10px 12px',
            background: '#0a0f1a',
            display: 'flex', gap: 8,
            borderTop: '1px solid #1e293b',
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="សួរអ្វីមួយ..."
              disabled={isLoading}
              style={{
                flex: 1, background: '#1e293b',
                border: '1px solid #2d3a4f', color: '#f1f5f9',
                padding: '9px 12px', borderRadius: 10, fontSize: 13,
                fontFamily: "'Kantumruy Pro', sans-serif",
                outline: 'none',
                opacity: isLoading ? 0.6 : 1,
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                background: 'linear-gradient(135deg,#1877F2,#0d5bbd)',
                color: '#fff', border: 'none',
                padding: '0 14px', borderRadius: 10,
                fontWeight: 700, cursor: 'pointer',
                fontSize: 13, opacity: (!input.trim() || isLoading) ? 0.45 : 1,
              }}
            >
              ផ្ញើ
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
