// pages/api/characters/list.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, bio, style, avatar_url, created_at
       FROM characters
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return res.status(200).json({ success: true, characters: rows });
  } catch (err) {
    console.error('characters/list error:', err);
    return res.status(500).json({ success: false, error: err.message || 'server_error' });
  }
}
