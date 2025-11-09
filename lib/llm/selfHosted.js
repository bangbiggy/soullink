export function selfHostedLLM() {
  const base = process.env.SELF_HOSTED_BASE_URL; // e.g. https://ai.your-vps.com/v1
  const key  = process.env.SELF_HOSTED_API_KEY;  // optional
  if (!base) throw new Error('SELF_HOSTED_BASE_URL missing');

  return {
    async chat(messages, { temperature = 0.8 } = {}) {
      const r = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(key ? { Authorization: `Bearer ${key}` } : {})
        },
        body: JSON.stringify({
          model: 'your-model-name', // your VPS model label
          temperature,
          messages
        })
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`self-hosted LLM error: ${r.status} ${t}`);
      }
      const j = await r.json();
      // adapt if your gateway returns a different shape
      return j.choices?.[0]?.message?.content || j.output || '';
    }
  };
}
