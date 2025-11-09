import { useEffect, useState } from 'react';

export default function PersonaPage() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [style, setStyle] = useState('');
  const [avatar, setAvatar] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const r = await fetch('/api/characters/list');
    const j = await r.json();
    if (r.ok) setList(j.characters || []);
  };

  useEffect(() => { load(); }, []);

  const createPersona = async () => {
    setMsg('');
    const r = await fetch('/api/characters/create', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, bio, style, avatar_url: avatar })
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || j.detail || 'Failed');
    setMsg('Created!');
    setName(''); setBio(''); setStyle(''); setAvatar('');
    load();
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    setMsg('characterId copied');
    setTimeout(()=>setMsg(''), 1200);
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Persona Editor</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded p-4">
          <h2 className="font-semibold mb-3">Create Persona</h2>

          <label className="block text-sm mb-1">Name *</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="w-full mb-3 px-3 py-2 rounded bg-white text-black" />

          <label className="block text-sm mb-1">Bio</label>
          <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={4} className="w-full mb-3 px-3 py-2 rounded bg-white text-black" />

          <label className="block text-sm mb-1">Style / Voice</label>
          <textarea value={style} onChange={e=>setStyle(e.target.value)} rows={2} className="w-full mb-3 px-3 py-2 rounded bg-white text-black" />

          <label className="block text-sm mb-1">Avatar URL</label>
          <input value={avatar} onChange={e=>setAvatar(e.target.value)} className="w-full mb-3 px-3 py-2 rounded bg-white text-black" placeholder="https://..." />

          <button onClick={createPersona} disabled={!name} className="px-4 py-2 rounded bg-pink-500 disabled:opacity-50">Create</button>
          {msg && <div className="mt-3 text-sm">{msg}</div>}
        </div>

        <div className="bg-white/5 border border-white/10 rounded p-4">
          <h2 className="font-semibold mb-3">Personas</h2>
          <div className="space-y-3">
            {list.map(p => (
              <div key={p.id} className="flex gap-3 items-center border border-white/10 rounded p-2">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.name} className="w-12 h-12 rounded object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded bg-zinc-700 grid place-items-center text-sm">N/A</div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-white/60 line-clamp-2">{p.bio}</div>
                </div>
                <button onClick={()=>copyId(p.id)} className="text-xs px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600">
                  Copy ID
                </button>
              </div>
            ))}
            {!list.length && <div className="text-sm text-white/60">No personas yet.</div>}
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-white/60">
        Use the copied <code>characterId</code> on the home page before creating a session.
      </div>
    </main>
  );
}
