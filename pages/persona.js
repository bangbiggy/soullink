// pages/persona.js
import { useEffect, useState } from "react";

export default function PersonaManager() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [style, setStyle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [list, setList] = useState([]);

  async function load() {
    try {
      const res = await fetch("/api/characters/list");
      const data = await res.json();
      setList(Array.isArray(data?.characters) ? data.characters : []);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createPersona(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/characters/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, style, avatar_url: avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      // clear fields
      setName(""); setBio(""); setStyle(""); setAvatarUrl("");
      await load();
    } catch (e) {
      setError(e.message || "server_error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", color: "#fff", padding: "0 16px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Persona Editor</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <form onSubmit={createPersona} style={{ background: "#0f0f0f", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginBottom: 12, fontWeight: 700 }}>Create Persona</h3>

          <label>Name *</label>
          <input
            value={name} onChange={e=>setName(e.target.value)}
            placeholder="e.g. Zee"
            style={{ width:"100%", padding:10, borderRadius:8, margin:"6px 0 12px", background:"#141414", color:"#fff", border:"1px solid #222" }}
          />

          <label>Bio</label>
          <textarea
            value={bio} onChange={e=>setBio(e.target.value)} rows={4}
            placeholder="Short description…"
            style={{ width:"100%", padding:10, borderRadius:8, margin:"6px 0 12px", background:"#141414", color:"#fff", border:"1px solid #222" }}
          />

          <label>Style / Voice</label>
          <textarea
            value={style} onChange={e=>setStyle(e.target.value)} rows={2}
            placeholder="Tone, quirks, guardrails…"
            style={{ width:"100%", padding:10, borderRadius:8, margin:"6px 0 12px", background:"#141414", color:"#fff", border:"1px solid #222" }}
          />

          <label>Avatar URL</label>
          <input
            value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)}
            placeholder="https://…"
            style={{ width:"100%", padding:10, borderRadius:8, margin:"6px 0 12px", background:"#141414", color:"#fff", border:"1px solid #222" }}
          />

          {error && <div style={{ color: "#ff7777", marginBottom: 12 }}>{error}</div>}
          <button
            disabled={saving}
            style={{ background:"#ff4fb3", color:"#fff", border:"none", borderRadius:8, padding:"10px 16px", cursor:"pointer" }}
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </form>

        <div style={{ background: "#0f0f0f", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginBottom: 12, fontWeight: 700 }}>Personas</h3>
          {list.length === 0 ? (
            <div style={{ opacity:.7 }}>No personas yet.</div>
          ) : (
            <div style={{ display:"grid", gap:12 }}>
              {list.map(p => (
                <div key={p.id} style={{ display:"flex", gap:12, alignItems:"center", background:"#111", padding:12, borderRadius:10 }}>
                  <div style={{
                    width:44, height:44, borderRadius:"50%", overflow:"hidden",
                    background:"#222", display:"grid", placeItems:"center", flexShrink:0
                  }}>
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    ) : (
                      <span style={{ fontWeight:700 }}>{(p.name||"S")[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div style={{ lineHeight:1.2 }}>
                    <div style={{ fontWeight:700 }}>{p.name}</div>
                    <div style={{ opacity:.75, fontSize:13 }}>{p.bio || "—"}</div>
                  </div>
                  <div style={{ marginLeft:"auto", opacity:.65, fontSize:12 }}>id: {p.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p style={{ marginTop:16, opacity:.7, fontSize:13 }}>
        Use the copied <code>characterId</code> on the home page before creating a session.
      </p>
    </div>
  );
}
