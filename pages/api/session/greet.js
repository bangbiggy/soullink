import pool from '../../../lib/db';
import { llm } from '../../../lib/config';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const { rows } = await pool.query(
      `select s.id, c.name, c.bio, c.style
       from chat_sessions s left join characters c on c.id = s.character_id
       where s.id = $1`, [sessionId]
    );
    const p = rows[0] || {};
    const name = p.name || 'SoulLink';
    const system = p?.name
      ? `You are ${p.name}. ${p.bio||''}\nStyle: ${p.style||'Playful, PG.'}`
      : `You are SoulLink: playful, kind, PG.`;

    const greeting = await llm.chat([
      { role:'system', content: system },
      { role:'user', content: `Write a short warm greeting (1–2 sentences) as ${name}. End with a gentle question.` }
    ], { temperature: 0.8 });

    await pool.query('insert into messages (session_id, role, text) values ($1,$2,$3)', [sessionId, 'assistant', greeting]);
    res.status(200).json({ greeting });
  } catch (e) {
    console.error('session_greet_error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
}
