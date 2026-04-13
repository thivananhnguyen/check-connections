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

// ============================================================
// Fonction utilitaire partagée — appel API provider
// ============================================================
async function callProvider(provider, prompt, options = {}) {
  const { temperature = 0.3, maxTokens = 200 } = options;
  // HuggingFace n'accepte pas temperature: 0
  const temp = provider.format === 'huggingface' && temperature === 0 ? 0.01 : temperature;

  let headers = { 'Content-Type': 'application/json' };
  let body;

  if (provider.format === 'openai') {
    headers['Authorization'] = `Bearer ${provider.key}`;
    body = JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temp,
    });
  } else {
    headers['Authorization'] = `Bearer ${provider.key}`;
    body = JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: maxTokens, temperature: temp },
    });
  }

  const start = Date.now();
  try {
    if (!provider.key) {
      return { provider: provider.name, content: null, latency: 0, error: 'Clé API manquante' };
    }

    const res = await fetch(provider.url, { method: 'POST', headers, body });
    const latency = Date.now() - start;

    if (!res.ok) {
      return { provider: provider.name, content: null, latency, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    let content = null;
    if (provider.format === 'openai') {
      content = data.choices?.[0]?.message?.content?.trim() || null;
    } else {
      const generated = data[0]?.generated_text || '';
      content = generated.replace(prompt, '').trim() || null;
    }

    return { provider: provider.name, content, latency };
  } catch (err) {
    return { provider: provider.name, content: null, latency: Date.now() - start, error: err.message };
  }
}

module.exports = { PROVIDERS, PRICING, callProvider };
