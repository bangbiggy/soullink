// pages/index.js
import { useEffect, useRef, useState } from 'react';

const LS_SESSION = 'soullink_session_id';
const LS_CHARACTER = 'soullink_character_id';

export default function Home() {
  const [sessionId, setSessionId] = useState('');
  const [text, setText] = useState('');
  const [reply, setReply] = useState('');
  const [err, setErr] = useState('');
  const [msgs, setMsgs] = useState([]);

  const [personas, setPersonas] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(''); // id
  const [personaMeta, setPersonaMeta] = useState(null);       // {id,name,avatar_url,...}

  const listRef = useRef(null);
  const scrollToBottom = () => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; };

  const loadMessages = async (sid) => {
    const r = await fetch(`/api/messages/list?sessionId=${sid}`);
    const j = await r.json();
    if (r.ok) setMsgs(j.messages || []);
  };

  const pickPersonaMeta = (id) => {
    if (!id) return setPersonaMeta(null);
    const p = personas.find(x => x.id === id) || null;
    setPersonaMeta(p);
  };

  // restore selection + personas + session
  useEffect(() => {
    const savedChar = typeof window !== 'undefined' ? localStorage.getItem(LS_CHARACTER) : '';
    if (savedChar) setSelectedPersona(savedChar);

    fetch('/api/characters/list')
      .then(r => r.json())
      .then(j => {
        const list = j.characters || j.personas || [];
        setPersonas(list);
        if (savedChar) {
          const found = list.find(c => c.id === savedChar);
          if (found) setPersonaMeta(found);
        }
      })
      .catch(()=>{});

    const savedSession = typeof window !== 'undefined' ? localStorage.getItem(LS_SESSION) : '';
    if (savedSession) {
      setSessionId(savedSession);
      loadMessages(savedSession).then(scrollToBottom);
    }
  }, []);

  // save session + reload msgs
  useEffect(() => {
    if (!sessionId) return;
    localStorage.setItem(LS_SESSION, sessionId);
    loadMessages(sessionId).then(scrollToBottom);
  }, [sessionId]);

  // save persona selection
  useEffect(() => {
    if (selectedPersona) localStorage.setItem(LS_CHARACTER, selectedPersona);
    else localStorage.removeItem(LS_CHARACTER);
    pickPersonaMeta(selectedPersona);
  }, [selectedPersona, personas]);

  const makeSession = async () => {
    setErr('');
    try {
      const r = await fetch('/api/session/create', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ characterId: selectedPersona || null })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || 'Failed to create session');

      setSessionId(j.sessionId);
      setMsgs([]);
      setReply('');

      // auto-greet (this inserts the first assistant message)
      await fetch('/api/session/greet', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ sessionId: j.sessionId })
      });
      await loadMessages(j.sessionId);
      scrollToBottom();
    } catch (e) { setErr(String(e.message || e)); }
  };

  const clearSession = () => {
    localStorage.removeItem(LS_SESSION);
    setSessionId('');
    setMsgs([]);
    setText('');
    setReply('');
  };

  const send = async () => {
    if (!text || !sessionId) return;
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
      await loadMessages(sessionId);
      scrollToBottom();
    } catch (e) { setErr(String(e.message || e)); }
  };

  // Avatar component used in assistant messages
  const AssistantAvatar = () => {
    const url = personaMeta?.avatar_url;
    const name = personaMeta?.name || 'SoulLink';
    if (url) return <img src={url} alt={name} className="w-8 h-8 rounded-full object-cover border border-white/10" />;
    return <div className="w-8 h-8 rounded-full bg-pink-600 grid place-items-center text-xs font-bold">
      {(name[0]||'S').toUpperCase()}
    </div>;
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-4xl font-extrabold mb-4">SoulLink — MVP Chat</h1>

      {/* Persona selector + buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <select
          value={selectedPersona}
          onChange={e=>setSelectedPersona(e.target.value)}
          className="px-3 py-2 rounded bg-white text-black"
          title="Choose a persona for the next session"
        >
          <option value="">Default SoulLink</option>
          {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <button onClick={makeSession} className="px-4 py-2 rounded bg-pink-500 hover:bg-pink-600">
          {sessionId ? 'New Chat (use selected persona)' : 'Create Session'}
        </button>

        {sessionId && (
          <button onClick={clearSession} className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600">
            End Session
          </button>
        )}

        <a href="/persona" className="text-sm opacity-80 hover:opacity-100 underline text-center sm:ml-2">
          Manage Personas
        </a>
      </div>

      <div className="text-sm opacity-80 mt-2">Session: {sessionId || '—'}</div>

      {/* Persona header */}
      <div className="w-full max-w-2xl mt-4 p-4 rounded bg-white/5 border border-white/10 flex items-center gap-3">
        {personaMeta ? (
          <>
            {personaMeta.avatar_url
              ? <img src={personaMeta.avatar_url} alt={personaMeta.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
              : <div className="w-12 h-12 rounded-full bg-pink-600 grid place-items-center text-lg">
                  {(personaMeta.name[0]||'S').toUpperCase()}
                </div>}
            <div className="leading-tight">
              <div className="font-semibold">{personaMeta.name}</div>
              <div className="text-xs text-white/60 line-clamp-1">{personaMeta.bio || 'SoulLink persona'}</div>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-pink-600 grid place-items-center text-lg">S</div>
            <div className="leading-tight">
              <div className="font-semibold">SoulLink</div>
              <div className="text-xs text-white/60">Default companion</div>
            </div>
          </>
        )}
      </div>

      {/* CHAT AREA */}
      <div className="w-full max-w-2xl mt-4 rounded border border-white/10 bg-white/5 flex flex-col">
        {/* messages list */}
        <div ref={listRef} className="h-[50vh] overflow-y-auto p-4 space-y-3 relative z-0">
          {msgs.map(m => (
            <div key={m.id || m.created_at}
                 className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start items-start gap-2'}>
              {/* >>> THIS is the exact spot the avatar is added for assistant messages */}
              {m.role === 'assistant' && (
                <div className="self-start">
                  <AssistantAvatar />
                </div>
              )}
              <div className={`max-w-[80%] px-3 py-2 rounded ${
                m.role === 'user' ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}>
                <span className="text-sm opacity-70 mr-2">
                  {m.role === 'user' ? 'You' : (personaMeta?.name || 'SoulLink')}:
                </span>
                {m.text}
              </div>
            </div>
          ))}
          {!msgs.length && sessionId && (
            <div className="text-center text-white/60 text-sm">Start the conversation…</div>
          )}
        </div>

        {/* input row */}
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
