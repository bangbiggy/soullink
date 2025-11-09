import { useState } from 'react';

export default function Home() {
  const [sessionId, setSessionId] = useState('');
  const [text, setText] = useState('');
  const [reply, setReply] = useState('');

  const makeSession = async () => {
    const r = await fetch('/api/session/create', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({})
    });
    const j = await r.json();
    setSessionId(j.sessionId);
  };

  const send = async () => {
    const r = await fetch('/api/chat/send', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ sessionId, userText: text })
    });
    const j = await r.json();
    setReply(j.reply || '');
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center gap-4 p-10">
      <h1 className="text-3xl font-bold">SoulLink — MVP Chat</h1>

      <button onClick={makeSession} className="px-4 py-2 rounded bg-pink-500 hover:bg-pink-600">
        Create Session
      </button>
      <div className="text-sm opacity-80">Session: {sessionId || '—'}</div>

      <input
        value={text}
        onChange={e=>setText(e.target.value)}
        placeholder="Say hi…"
        className="w-80 px-3 py-2 rounded text-black"
      />
      <button
        onClick={send}
        disabled={!sessionId || !text}
        className="px-4 py-2 rounded bg-indigo-500 disabled:opacity-50"
      >
        Send
      </button>

      <div className="mt-6 max-w-xl whitespace-pre-wrap">{reply}</div>
    </main>
  );
}
