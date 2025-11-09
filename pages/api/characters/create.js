import pool from '../../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { name, bio = '', style = '', avatar_url = '' } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });

    const { rows } = await pool.query(
      `insert into characters (name, bio, style, avatar_url)
       values ($1,$2,$3,$4) returning *`,
      [name, bio, style, avatar_url]
    );
    res.status(200).json({ character: rows[0] });
  } catch (e) {
    console.error('character_create_error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
}
