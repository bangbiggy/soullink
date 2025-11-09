import OpenAI from 'openai';
import pool from '../../../lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { sessionId, userText } = req.body || {};
    if (!sessionId || !userText) {
      return res.status(400).json({ error: 'sessionId and userText required' });
    }

    await pool.query(
      'insert into messages (session_id, role, text) values ($1,$2,$3)',
      [sessionId, 'user', userText]
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are SoulLink: a playful, respectful AI companion.' },
        { role: 'user', content: userText }
      ],
      temperature: 0.8
    });

    const reply = completion.choices?.[0]?.message?.content || '…';

    await pool.query(
      'insert into messages (session_id, role, text) values ($1,$2,$3)',
      [sessionId, 'assistant', reply]
    );

    return res.status(200).json({ reply });
  } catch (e) {
    console.error('chat_send_error:', e);
    return res.status(500).json({ error: 'server_error', detail: e.message });
  }
}
