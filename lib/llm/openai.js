import OpenAI from 'openai';

export function openaiLLM() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return {
    async chat(messages, { temperature = 0.8 } = {}) {
      const r = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature,
        messages
      });
      return r.choices?.[0]?.message?.content || '';
    }
  };
}
