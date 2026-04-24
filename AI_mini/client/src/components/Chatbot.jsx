import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, User, Bot, Loader2 } from 'lucide-react';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your AI financial assistant. Ask me anything about your expenses." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/chat', { message: userMsg.content });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that request right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px', border: '1px solid var(--panel-border)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'flex-start',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
          }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: msg.role === 'user' ? 'var(--accent-color)' : 'rgba(168, 85, 247, 0.2)',
              color: msg.role === 'user' ? 'white' : '#c084fc',
              flexShrink: 0
            }}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div style={{
              background: msg.role === 'user' ? 'var(--accent-color)' : 'var(--panel-bg)',
              padding: '12px 16px',
              borderRadius: '16px',
              borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
              borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
              maxWidth: '80%',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
              <Bot size={16} />
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--panel-bg)', borderRadius: '16px', borderTopLeftRadius: '4px' }}>
              <Loader2 className="animate-spin" size={16} color="var(--text-secondary)" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSend} style={{ display: 'flex', padding: '12px', background: 'rgba(15, 23, 42, 0.8)', borderTop: '1px solid var(--panel-border)' }}>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your expenses..." 
          style={{ flex: 1, border: 'none', background: 'transparent', borderRadius: 0, padding: '8px' }}
          disabled={loading}
        />
        <button type="submit" disabled={!input.trim() || loading} style={{ background: 'transparent', color: 'var(--accent-color)', padding: '8px' }}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
