import { useEffect, useRef, useState } from 'react';

const LS_KEY = 'soullink_session_id';

export default function Home() {
  const [sessionId, setSessionId] = useState('');
  const [text, setText] = useState('');
  const [reply, setReply] = useState('');
  const [err, setErr] = useState('');
  const [msgs, setMsgs] = useState([]);
  const listRef = useRef(null);

  const scrollToBottom = () => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  };

  const loadMessages = async (sid) => {
    const r = await fetch(`/api/messages/list?sessionId=${sid}`);
    const j = await r.json();
    if (r.ok) setMsgs(j.messages || []);
  };

  // 🔹 Restore session on first load
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : '';
    if (saved) {
      setSessionId(saved);
      loadMessages(saved).then(scrollToBottom);
    }
  }, []);

  // 🔹 When session changes, save to localStorage & fetch messages
  useEffect(() => {
    if (!sessionId) return;
    localStorage.setItem(LS_KEY, sessionId);
    loadMessages(sessionId).then(scrollToBottom);
  }, [sessionId]);

  const makeSession = async () => {
    setErr('');
    try {
      const r = await fetch('/api/session/create', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({})
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || 'Failed to create session');
      setSessionId(j.sessionId);
      setMsgs([]);
      setReply('');
    } catch (e) { setErr(String(e.message || e)); }
  };

  const clearSession = () => {
    localStorage.removeItem(LS_KEY);
    setSessionId('');
    setMsgs([]);
    setText('');
    setReply('');
  };

  const send = async () => {
    if (!text || !sessionId) return;
    setErr('');

    // optimistic render
    const localUser = { id: crypto.randomUUID(), role:'user', text, created_at: new Date().toISOString() };
    setMsgs(prev => [...prev, localUser]);
    setText('');
    scrollToBottom();

    try {
      const r = await fetch('/api/chat/send', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ sessionId, userText: localUser.text })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || 'Failed to send message');
      setReply(j.reply || '');
      await loadMessages(sessionId);
      scrollToBottom();
    } catch (e) { setErr(String(e.message || e)); }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-4xl font-extrabold mb-4">SoulLink — MVP Chat</h1>

      <div className="flex gap-3">
        <button onClick={makeSession} className="px-4 py-2 rounded bg-pink-500 hover:bg-pink-600">
          {sessionId ? 'New Chat' : 'Create Session'}
        </button>
        {sessionId && (
          <button onClick={clearSession} className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600">
            End Session
          </button>
        )}
      </div>

      <div className="text-sm opacity-80 mt-2">Session: {sessionId || '—'}</div>

      {/* CHAT AREA */}
      <div className="w-full max-w-2xl mt-6 rounded border border-white/10 bg-white/5 flex flex-col">
        <div ref={listRef} className="h-[50vh] overflow-y-auto p-4 space-y-3 relative z-0">
          {msgs.map(m => (
            <div key={m.id || m.created_at} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <div className={`inline-block px-3 py-2 rounded ${m.role === 'user' ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
                <span className="text-sm opacity-70 mr-2">{m.role === 'user' ? 'You' : 'SoulLink'}:</span>
                {m.text}
              </div>
            </div>
          ))}
          {!msgs.length && sessionId && (
            <div className="text-center text-white/50 text-sm">Start the conversation…</div>
          )}
        </div>

        <div className="flex gap-2 p-3 border-t border-white/10 bg-black/60 sticky bottom-0 z-10">
          <input
            value={text}
            onChange={e=>setText(e.target.value)}
            placeholder={sessionId ? 'Say hi…' : 'Create a session first'}
            className="flex-1 px-3 py-2 rounded bg-white text-black border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500"
            onKeyDown={(e)=>{ if(e.key==='Enter' && sessionId && text) send(); }}
            disabled={!sessionId}
          />
          <button
            onClick={send}
            disabled={!sessionId || !text}
            className="px-4 py-2 rounded bg-indigo-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      {err && <div className="mt-3 text-red-400 text-sm">Error: {err}</div>}
      {reply && <div className="mt-6 max-w-2xl text-lg">{reply}</div>}
    </main>
  );
}
