import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const S = {
  bg: '#0A0F1E', surface: '#111827', border: '#1E2A3A',
  text: '#F5F0E8', muted: '#8A9BB0', gold: '#C9A84C',
};

export default function KingsCoachChat({ onClose }) {
  const saveAndClose = async () => {
    // Save durable memories from this conversation (fire and forget)
    try {
      const current = messagesRef.current;
      if (current && current.length >= 2) {
        api.post('/coach/save-memory', { history: current });
      }
    } catch (e) { /* silent */ }
    onClose();
  };
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(true);
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(10);
  const endRef = useRef(null);
  const messagesRef = useRef([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/coach/open');
        setMessages([{ role: 'assistant', content: res.data.opening }]);
        setUsed(res.data.messages_used || 0);
        setLimit(res.data.messages_limit || 10);
      } catch (e) {
        setMessages([{ role: 'assistant', content: "I'm having trouble right now. Try again in a moment." }]);
      } finally {
        setOpening(false);
      }
    })();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || used >= limit) return;
    const newHistory = [...messages, { role: 'user', content: text }];
    setMessages(newHistory);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/coach/chat', { message: text, history: newHistory });
      setMessages([...newHistory, { role: 'assistant', content: res.data.reply }]);
      setUsed(res.data.messages_used);
    } catch (e) {
      const msg = e.response?.status === 429
        ? "You've used all 10 messages today. Come back tomorrow 👑"
        : "Something went wrong. Try again.";
      setMessages([...newHistory, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 60 }} className="flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="w-full sm:max-w-lg h-[85vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div style={{ borderBottom: `1px solid ${S.border}` }} className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <div>
              <p style={{ color: S.text }} className="text-sm font-bold">King's Coach</p>
              <p style={{ color: S.muted }} className="text-xs">{limit - used} messages left today</p>
            </div>
          </div>
          <button onClick={saveAndClose} style={{ color: S.muted }} className="text-2xl leading-none">×</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {opening && <p style={{ color: S.muted }} className="text-sm text-center py-6">👑 Thinking...</p>}
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div style={{
                backgroundColor: m.role === 'user' ? S.gold : S.bg,
                color: m.role === 'user' ? S.bg : S.text,
                border: m.role === 'user' ? 'none' : `1px solid ${S.border}`
              }} className="max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          ))}
          {loading && <p style={{ color: S.muted }} className="text-xs">Coach is typing...</p>}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop: `1px solid ${S.border}` }} className="p-3 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            disabled={used >= limit}
            placeholder={used >= limit ? 'Come back tomorrow' : 'Ask your coach...'}
            style={{ backgroundColor: S.bg, border: `1px solid ${S.border}`, color: S.text }}
            className="flex-1 px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-yellow-600" />
          <button onClick={send} disabled={loading || used >= limit || !input.trim()}
            style={{ backgroundColor: S.gold, color: S.bg }}
            className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}