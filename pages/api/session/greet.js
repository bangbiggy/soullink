// pages/api/session/greet.js
import OpenAI from 'openai';
import pool from '../../../lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    // load persona for this session (if any)
    const { rows } = await pool.query(
      `select s.id, c.name, c.bio, c.style
       from chat_sessions s
       left join characters c on c.id = s.character_id
       where s.id = $1`,
      [sessionId]
    );
    if (!rows.length) return res.status(404).json({ error: 'session not found' });

    const p = rows[0] || {};
    const personaName = p.name || 'SoulLink';

    const system = (p.name)
      ? `You are ${p.name}. ${p.bio || ''}

Style/voice: ${p.style || 'Playful, kind, flirty-but-respectful (PG). Keep replies concise.'}`
      : `You are SoulLink: playful, kind, PG-13 only. Keep replies concise.`;

    // ask OpenAI for a short, warm greeting
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Write a very short, warm greeting (1–2 sentences) as ${personaName}. Keep it PG. End with a gentle question.` }
      ],
      max_tokens: 90
    });

    const greeting = completion.choices?.[0]?.message?.content || `Hi, I’m ${personaName}! How are you today?`;

    // save assistant greeting
    await pool.query(
      'insert into messages (session_id, role, text) values ($1,$2,$3)',
      [sessionId, 'assistant', greeting]
    );

    return res.status(200).json({ greeting });
  } catch (e) {
    console.error('session_greet_error:', e);
    return res.status(500).json({ error: 'server_error', detail: e.message });
  }
}
