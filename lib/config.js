import { openaiLLM } from './llm/openai.js';
import { selfHostedLLM } from './llm/selfHosted.js';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';

export const llm = LLM_PROVIDER === 'self_hosted' ? selfHostedLLM() : openaiLLM();
