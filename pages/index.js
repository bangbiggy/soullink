import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [sessionId, setSessionId] = useState('');
  const [text, setText] = useState('');
  const [reply, setReply] = useState(''); // keep last reply
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
      // reload from server to keep order and ids
      await loadMessages(sessionId);
      scrollToBottom();
    } catch (e) { setErr(String(e.message || e)); }
  };

  useEffect(() => { if (sessionId) loadMessages(sessionId).then(scrollToBottom); }, [sessionId]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-4xl font-extrabold mb-4">SoulLink — MVP Chat</h1>

      <button onClick={makeSession} className="px-4 py-2 rounded bg-pink-500 hover:bg-pink-600">
        Create Session
      </button>
      <div className="text-sm opacity-80 mt-2">Session: {sessionId || '—'}</div>

      <div
        ref={listRef}
        className="w-full max-w-2xl h-[50vh] mt-6 overflow-y-auto rounded border border-white/10 p-4 space-y-3 bg-white/5"
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

      <div className="flex gap-2 mt-4 w-full max-w-2xl">
        <input
          value={text}
          onChange={e=>setText(e.target.value)}
          placeholder="Say hi…"
          className="flex-1 px-3 py-2 rounded text-black"
        />
        <button
          onClick={send}
          disabled={!sessionId || !text}
          className="px-4 py-2 rounded bg-indigo-500 disabled:opacity-50"
        >
          Send
        </button>
      </div>

      {err && <div className="mt-3 text-red-400 text-sm">Error: {err}</div>}
      {reply && <div className="mt-6 max-w-2xl text-lg">{reply}</div>}
    </main>
  );
}
