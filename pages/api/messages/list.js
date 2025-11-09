import pool from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const { rows } = await pool.query(
      `select id, role, text, created_at
       from messages
       where session_id = $1
       order by created_at asc`,
      [sessionId]
    );
    res.status(200).json({ messages: rows });
  } catch (e) {
    console.error('messages_list_error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
}
