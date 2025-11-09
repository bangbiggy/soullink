// pages/index.js
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

function PersonaAvatar({ src, name = 'SoulLink', size = 32 }) {
  const initials = useMemo(() => {
    const s = (name || '').trim();
    if (!s) return 'S';
    return s
      .split(/\s+/)
      .map((w) => (w[0] || '').toUpperCase())
      .join('')
      .slice(0, 2) || 'S';
  }, [name]);

  const baseStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ff2d6b',
    color: 'white',
    fontWeight: 700,
    fontSize: Math.max(12, Math.floor(size * 0.42)),
    overflow: 'hidden',
    flex: '0 0 auto',
  };

  if (src && /^https?:\/\//i.test(src)) {
    return (
      <img
        src={src}
        alt={name || 'avatar'}
        width={size}
        height={size}
        style={{ ...baseStyle, objectFit: 'cover' }}
        onError={(e) => {
          // Hide broken image and show fallback
          e.currentTarget.style.display = 'none';
          const fallback = document.createElement('div');
          Object.assign(fallback.style, baseStyle);
          fallback.textContent = initials;
          e.currentTarget.parentElement?.appendChild(fallback);
        }}
      />
    );
  }

  return (
    <div style={baseStyle} aria-label={name}>
      {initials}
    </div>
  );
}

export default function Home() {
  const [personas, setPersonas] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedPersona = useMemo(
    () => personas.find((p) => p.id === selectedCharacterId),
    [personas, selectedCharacterId]
  );

  const listRef = useRef(null);

  // Auto-scroll chat to the bottom on message updates
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Load personas on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/characters/list');
        const data = await res.json();
        const items = data?.characters || data?.items || [];
        setPersonas(items);

        // restore selection
        const saved = typeof window !== 'undefined' && localStorage.getItem('personaId');
        if (saved && items.some((p) => p.id === saved)) {
          setSelectedCharacterId(saved);
        } else if (items.length) {
          setSelectedCharacterId(items[0].id);
        }
      } catch (e) {
        console.error('Failed to load personas', e);
      }
    })();
  }, []);

  // Persist persona selection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedCharacterId) localStorage.setItem('personaId', selectedCharacterId);
  }, [selectedCharacterId]);

  async function createSession() {
    if (!selectedCharacterId) return;
    setCreatingSession(true);
    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: selectedCharacterId }),
      });
      const data = await res.json();
      // Normalized possible keys: sessionId | id | session_id
      const sid = data.sessionId || data.id || data.session_id;
      if (sid) {
        setSessionId(sid);
        setMessages([]); // fresh chat
      } else {
        console.error('No session id from /api/session/create', data);
      }
    } catch (e) {
      console.error('Create session failed', e);
    } finally {
      setCreatingSession(false);
    }
  }

  function endSession() {
    setSessionId('');
    setMessages([]);
  }

  async function sendMessage() {
    if (!sessionId || !input.trim()) return;
    const text = input.trim();
    setInput('');
    // Optimistic user message
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setSending(true);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const data = await res.json();

      // Accept a few possible reply shapes
      const reply =
        data.reply ||
        data.message ||
        data.text ||
        data.assistant ||
        (Array.isArray(data.messages)
          ? (data.messages.find((m) => m.role === 'assistant') || {}).content
          : '');

      if (reply) {
        setMessages((m) => [...m, { role: 'assistant', content: reply }]);
      } else if (Array.isArray(data.messages)) {
        // Some endpoints return the entire transcript
        const normalized = data.messages.map((m) => ({
          role: m.role,
          content: m.content || m.text || '',
        }));
        setMessages(normalized);
      } else {
        console.warn('No assistant reply field found.', data);
      }
    } catch (e) {
      console.error('Send failed', e);
      // Optional: show error bubble
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: "Hmm, I couldn't send that. Try again?" },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ textAlign: 'center', fontSize: 40, fontWeight: 800, marginBottom: 16 }}>
          SoulLink — MVP Chat
        </h1>

        {/* Controls row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <select
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
            style={{
              padding: '8px 10px',
              background: '#111',
              color: '#fff',
              borderRadius: 6,
              border: '1px solid #333',
              minWidth: 220,
            }}
          >
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || 'Unnamed Persona'}
              </option>
            ))}
          </select>

          <button
            onClick={createSession}
            disabled={!selectedCharacterId || creatingSession}
            style={{
              padding: '10px 14px',
              background: '#ff2d6b',
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              opacity: creatingSession ? 0.7 : 1,
            }}
          >
            {creatingSession ? 'Creating…' : 'New Chat (use selected persona)'}
          </button>

          <button
            onClick={endSession}
            disabled={!sessionId}
            style={{
              padding: '10px 14px',
              background: '#333',
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              borderRadius: 8,
              cursor: sessionId ? 'pointer' : 'not-allowed',
              opacity: sessionId ? 1 : 0.6,
            }}
          >
            End Session
          </button>

          <Link
            href="/persona"
            style={{
              marginLeft: 6,
              color: '#9da3ff',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            Manage Personas
          </Link>
        </div>

        {/* Session label */}
        <div style={{ textAlign: 'center', opacity: 0.7, marginBottom: 14 }}>
          Session: {sessionId || '—'}
        </div>

        {/* Persona header card */}
        <div
          style={{
            background: '#0b0b0b',
            border: '1px solid #222',
            borderRadius: 10,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <PersonaAvatar
            src={selectedPersona?.avatar_url}
            name={selectedPersona?.name || 'SoulLink'}
            size={40}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              {selectedPersona?.name || 'SoulLink'}
            </div>
            <div style={{ opacity: 0.8, fontSize: 12 }}>
              {selectedPersona?.bio || 'Default companion'}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div
          ref={listRef}
          style={{
            background: '#0b0b0b',
            border: '1px solid #222',
            borderRadius: 10,
            height: 460,
            overflowY: 'auto',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {messages.length === 0 && (
            <div style={{ opacity: 0.6, textAlign: 'center', marginTop: 10 }}>
              {sessionId ? 'Say hi…' : 'Create a session to start chatting.'}
            </div>
          )}

          {messages.map((m, idx) => {
            const isAssistant = m.role === 'assistant';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  flexDirection: isAssistant ? 'row' : 'row-reverse',
                }}
              >
                {/* Avatar for assistant only */}
                {isAssistant ? (
                  <PersonaAvatar
                    src={selectedPersona?.avatar_url}
                    name={selectedPersona?.name || 'SoulLink'}
                    size={28}
                  />
                ) : (
                  <div style={{ width: 28 }} />
                )}

                <div
                  style={{
                    background: isAssistant ? '#1c1c1f' : '#2b2472',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '10px 12px',
                    maxWidth: '78%',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.45,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 4 }}>
                    {isAssistant ? selectedPersona?.name || 'SoulLink' : 'You'}
                  </div>
                  <div>{m.content}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Composer */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <textarea
            placeholder={sessionId ? 'Say hi…' : 'Create a session first'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!sessionId || sending}
            rows={1}
            style={{
              flex: 1,
              padding: '12px 14px',
              background: '#0b0b0b',
              color: '#fff',
              borderRadius: 10,
              border: '1px solid #222',
              resize: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!sessionId || sending || !input.trim()}
            style={{
              padding: '10px 16px',
              background: '#2b2472',
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              borderRadius: 10,
              cursor: !sessionId || sending || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: !sessionId || sending || !input.trim() ? 0.6 : 1,
            }}
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
