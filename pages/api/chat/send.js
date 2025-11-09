import pool from '../../../lib/db';
import { llm } from '../../../lib/config';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { sessionId, userText } = req.body || {};
    if (!sessionId || !userText) return res.status(400).json({ error: 'sessionId and userText required' });

    await pool.query('insert into messages (session_id, role, text) values ($1,$2,$3)', [sessionId, 'user', userText]);

    // build system + history as you already do:
    const sess = await pool.query(
      `select s.character_id, c.name, c.bio, c.style
       from chat_sessions s left join characters c on c.id = s.character_id
       where s.id = $1`, [sessionId]
    );
    const p = sess.rows[0] || {};
    const system = p?.name
      ? `You are ${p.name}. ${p.bio||''}\nStyle: ${p.style||'Playful, PG.'}`
      : `You are SoulLink: playful, kind, PG.`;

    const { rows } = await pool.query(
      `select role, text from messages where session_id=$1 order by created_at asc limit 20`, [sessionId]
    );
    const history = [{ role:'system', content: system }, ...rows.map(r => ({ role:r.role, content:r.text }))];

    const reply = await llm.chat(history, { temperature: 0.8 });

    await pool.query('insert into messages (session_id, role, text) values ($1,$2,$3)', [sessionId, 'assistant', reply]);
    res.status(200).json({ reply });
  } catch (e) {
    console.error('chat_send_error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
}
