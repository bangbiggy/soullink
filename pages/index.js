import { useEffect, useRef, useState } from 'react';

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

  const send = async () => {
    if (!text) return;
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

  useEffect(() => {
    if (sessionId) loadMessages(sessionId).then(scrollToBottom);
  }, [sessionId]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-4xl font-extrabold mb-4">SoulLink — MVP Chat</h1>

      <button onClick={makeSession} className="px-4 py-2 rounded bg-pink-500 hover:bg-pink-600">
        Create Session
      </button>
      <div className="text-sm opacity-80 mt-2">Session: {sessionId || '—'}</div>

      {/* CHAT AREA */}
      <div className="w-full max-w-2xl mt-6 rounded border border-white/10 bg-white/5 flex flex-col">
        {/* messages list */}
        <div
          ref={listRef}
          className="h-[50vh] overflow-y-auto p-4 space-y-3 relative z-0"
        >
          {msgs.map(m => (
            <div key={m.id || m.created_at} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <div className={`inline-block px-3 py-2 rounded ${
                m.role === 'user' ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}>
                <span className="text-sm opacity-70 mr-2">{m.role === 'user' ? 'You' : 'SoulLink'}:</span>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* input row */}
        <div className="flex gap-2 p-3 border-t border-white/10 bg-black/60 sticky bottom-0 z-10">
          <input
            value={text}
            onChange={e=>setText(e.target.value)}
            placeholder="Say hi…"
            className="flex-1 px-3 py-2 rounded bg-white text-black border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500"
            onKeyDown={(e)=>{ if(e.key==='Enter' && sessionId && text) send(); }}
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
