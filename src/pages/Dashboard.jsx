import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Zap, LogOut, Send, X, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ─── Chat Modal ─────────────────────────────────────────────────────────────

function PersonalizationModal({ onClose, user }) {
  const navigate = useNavigate();
  const chatKey = `agentChat_${user?._id}`;

  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(chatKey);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const initialized = useRef(false);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist chat to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(chatKey, JSON.stringify(messages));
    }
  }, [messages, chatKey]);

  // Kick off first message only if no saved history
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      if (messages.length === 0) {
        sendToAgent([]);
      }
    }
  }, []);

  async function sendToAgent(history) {
    setIsStreaming(true);
    let streamedText = '';

    try {
      const response = await fetch(`${API_URL}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ messages: history }),
      });

      if (!response.ok) throw new Error('Network error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Placeholder for the assistant's streaming message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;

          try {
            const parsed = JSON.parse(payload);

            if (parsed.text) {
              streamedText += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: streamedText };
                return updated;
              });
            }

            if (parsed.profile) {
              // Update final assistant message before navigating
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: "Great, I've got everything I need. Taking you to your profile now...",
                };
                localStorage.setItem(chatKey, JSON.stringify(updated));
                return updated;
              });
              // Small pause so user reads the message, then navigate
              setTimeout(() => {
                onClose();
                navigate('/profile-review', { state: { profile: parsed.profile } });
              }, 1200);
            }
          } catch { /* skip bad chunks */ }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    sendToAgent(newMessages.map((m) => ({ role: m.role, content: m.content })));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    localStorage.removeItem(chatKey);
    setMessages([]);
    initialized.current = false;
    setTimeout(() => {
      initialized.current = true;
      sendToAgent([]);
    }, 0);
  };

  const overlay = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)',
    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  };

  const modal = {
    backgroundColor: '#fff', borderRadius: '16px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    width: '100%', maxWidth: '680px',
    height: '80vh', maxHeight: '760px',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  };

  const messageStyle = (role) => ({
    maxWidth: '85%',
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    backgroundColor: role === 'user' ? 'var(--primary-color)' : '#f1f5f9',
    color: role === 'user' ? '#fff' : 'var(--text-main)',
    borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    padding: '0.75rem 1rem',
    fontSize: '0.95rem',
    lineHeight: '1.55',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  });

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#ede9fe', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="var(--primary-color)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>Setup Agent</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Audience segmentation interview</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Restart
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2rem' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 0.5rem' }} />
              Starting...
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={messageStyle(msg.role)}>
              {msg.content || (isStreaming && i === messages.length - 1 ? (
                <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor', animation: 'bounce 1s infinite 0s' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor', animation: 'bounce 1s infinite 0.2s' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor', animation: 'bounce 1s infinite 0.4s' }} />
                </span>
              ) : '')}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem', flexShrink: 0, backgroundColor: '#fff' }}>
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer…"
            disabled={isStreaming}
            style={{
              flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px',
              padding: '0.625rem 0.875rem', fontSize: '0.95rem', fontFamily: 'inherit',
              resize: 'none', outline: 'none', backgroundColor: isStreaming ? '#f8fafc' : '#fff',
              color: 'var(--text-main)', lineHeight: '1.5',
            }}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            style={{
              backgroundColor: isStreaming || !input.trim() ? '#e2e8f0' : 'var(--primary-color)',
              color: isStreaming || !input.trim() ? '#94a3b8' : '#fff',
              border: 'none', borderRadius: '10px', width: '44px', height: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
              flexShrink: 0, alignSelf: 'flex-end', transition: 'background-color 0.15s',
            }}
          >
            {isStreaming ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const getInitials = (email) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>

      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-color)', padding: '1rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.25rem', letterSpacing: '-0.025em' }}>
          <Zap size={24} color="var(--primary-color)" fill="var(--primary-color)" /> MarTech
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Workspace</span>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user?.agentProfile && (
              <>
                <button onClick={() => navigate('/website-analyzer')} style={{ fontSize: '0.875rem', color: 'var(--primary-color)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Website Analyzer
                </button>
                <button onClick={() => navigate('/variants')} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Variants
                </button>
                <button onClick={() => navigate('/profile-review')} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Edit Profile
                </button>
              </>
            )}
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
              {getInitials(user?.email)}
            </div>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, padding: '3rem 2.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', letterSpacing: '-0.04em', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Welcome to Command.
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '600px' }}>
            Select a service below to get started and personalise your MarTech experience.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
          <div
            onClick={() => setChatOpen(true)}
            style={{
              backgroundColor: '#ffffff', borderRadius: 'var(--radius-xl)', padding: '2.5rem',
              border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer', transition: 'all 0.2s ease',
              display: 'flex', flexDirection: 'column', gap: '1.5rem',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = 'var(--primary-color)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <div style={{ backgroundColor: '#ede9fe', width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={28} color="var(--primary-color)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '600', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Personalised website service</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5' }}>
                Tailor your entire website experience dynamically for different user segments. Unlock powerful personalization features to drive conversions.
              </p>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontWeight: '600', fontSize: '0.95rem' }}>
              {user?.agentProfile ? 'Reconfigure Personalization →' : 'Configure Personalization →'}
            </div>
          </div>
        </div>
      </main>

      {chatOpen && (
        <PersonalizationModal
          user={user}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
