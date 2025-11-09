// lib/config.js
import { openaiLLM } from './llm/openai.js';
import { selfHostedLLM } from './llm/selfHosted.js';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';

console.log(`🧠 SoulLink active LLM provider → ${LLM_PROVIDER}`);

export const llm =
  LLM_PROVIDER === 'self_hosted' ? selfHostedLLM() : openaiLLM();
const color = LLM_PROVIDER === 'self_hosted' ? '\x1b[36m' : '\x1b[35m';
console.log(`${color}🧠 SoulLink active LLM provider → ${LLM_PROVIDER}\x1b[0m`);
