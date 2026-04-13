require('dotenv').config();

const PROVIDERS = [
  {
    name: 'Mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY,
    model: 'mistral-small-latest',
    format: 'openai',
  },
  {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    format: 'openai',
  },
  {
    name: 'HuggingFace',
    url: 'https://router.huggingface.co/novita/v3/openai/chat/completions',
    key: process.env.HF_API_KEY,
    model: 'meta-llama/llama-3.1-8b-instruct',
    format: 'openai',
  },
];


const PRICING = [
  { provider: 'Mistral Small', costPerMillionTokens: 0.20 },
  { provider: 'Groq Llama 3', costPerMillionTokens: 0.05 },
  { provider: 'GPT-4o', costPerMillionTokens: 2.50 },
];

module.exports = { PROVIDERS, PRICING };
