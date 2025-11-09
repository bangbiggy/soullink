import OpenAI from 'openai';
import pool from '../../../lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// fallback persona (until we add UI + characters table usage)
const personaSystem = `You are SoulLink: playful, kind, flirty-but-respectful.
Keep replies concise unless user asks for more. Avoid explicit content.
Use a warm tone with a hint of humor.`;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { sessionId, userText } = req.body || {};
    if (!sessionId || !userText) return res.status(400).json({ error: 'sessionId and userText required' });

    // 1) save user message
    await pool.query('insert into messages (session_id, role, text) values ($1,$2,$3)', [sessionId, 'user', userText]);

    // 2) load last 15 msgs for context (oldest → newest)
    const { rows } = await pool.query(
      `select role, text from messages
       where session_id = $1
       order by created_at asc
       limit 15`,
      [sessionId]
    );

    const history = rows.map(r => ({ role: r.role, content: r.text }));

    // 3) call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      messages: [{ role: 'system', content: personaSystem }, ...history],
    });

    const reply = completion.choices?.[0]?.message?.content || '…';

    // 4) save assistant reply
    await pool.query('insert into messages (session_id, role, text) values ($1,$2,$3)', [sessionId, 'assistant', reply]);

    res.status(200).json({ reply });
  } catch (e) {
    console.error('chat_send_error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
}
