// pages/api/session/create.js
import { pool } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId = null, characterId = null } = req.body || {};
    const r = await pool.query(
      'insert into chat_sessions (user_id, character_id) values ($1,$2) returning id',
      [userId, characterId]
    );

    res.status(200).json({ sessionId: r.rows[0].id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
}
