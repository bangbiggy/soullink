import pool from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const { rows } = await pool.query(
      'select id, name, bio, style, avatar_url, created_at from characters order by created_at desc'
    );
    res.status(200).json({ characters: rows });
  } catch (e) {
    console.error('character_list_error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
}
