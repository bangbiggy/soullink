// pages/api/characters/create.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { name, bio = '', style = '', avatar_url = '' } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO characters (name, bio, style, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, bio, style, avatar_url, created_at`,
      [name.trim(), bio, style, avatar_url]
    );

    return res.status(200).json({ success: true, character: rows[0] });
  } catch (err) {
    console.error('characters/create error:', err);
    return res.status(500).json({ success: false, error: err.message || 'server_error' });
  }
}
