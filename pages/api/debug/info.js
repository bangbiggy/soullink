export default function handler(req, res) {
  try {
    const provider = process.env.LLM_PROVIDER || "not set";
    const db = process.env.DATABASE_URL ? "connected" : "missing";
    const apiKey = process.env.OPENAI_API_KEY ? "active" : "missing";

    res.status(200).json({
      success: true,
      provider,
      db_status: db,
      openai_key: apiKey,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
