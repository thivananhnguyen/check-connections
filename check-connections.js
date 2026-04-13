require('dotenv').config();

// ============================================================
// Phase 1 : Vérification des clés API
// ============================================================
const KEYS = [
  { name: 'MISTRAL_API_KEY', value: process.env.MISTRAL_API_KEY },
  { name: 'GROQ_API_KEY', value: process.env.GROQ_API_KEY },
  { name: 'HF_API_KEY', value: process.env.HF_API_KEY }
];

function checkKeys() {
  console.log('--- Vérification des clés API ---');
  for (const k of KEYS) {
    console.log(`${k.name}: ${k.value ? 'présente' : 'MANQUANTE ⚠️'}`);
  }
  console.log('');
}

// ============================================================
// Phase 2-3 : Fonction générique checkProvider (DRY)
// ============================================================
const isVerbose = process.argv.includes('--verbose');

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

async function checkProvider(provider) {
  const prompt = isVerbose
    ? 'Donne-moi la capitale de la France en un mot.'
    : 'Dis juste ok';

  let body;
  let headers = { 'Content-Type': 'application/json' };

  if (provider.format === 'openai') {
    headers['Authorization'] = `Bearer ${provider.key}`;
    body = JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: isVerbose ? 20 : 5,
    });
  } else {
    // HuggingFace
    headers['Authorization'] = `Bearer ${provider.key}`;
    body = JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: isVerbose ? 20 : 5 },
    });
  }

  const start = Date.now();
  try {
    if (!provider.key) {
      return {
        provider: provider.name,
        status: 'ERROR',
        latency: 0,
        error: 'Clé API manquante',
      };
    }

    const res = await fetch(provider.url, { method: 'POST', headers, body });
    const latency = Date.now() - start;

    if (!res.ok) {
      return {
        provider: provider.name,
        status: 'ERROR',
        latency,
        error: `HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    let content = null;
    if (provider.format === 'openai') {
      content = data.choices?.[0]?.message?.content?.trim() || null;
    } else {
      const generated = data[0]?.generated_text || '';
      content = generated.replace(prompt, '').trim() || null;
    }

    return {
      provider: provider.name,
      status: 'OK',
      latency,
      ...(isVerbose && content ? { response: content } : {}),
    };
  } catch (err) {
    return {
      provider: provider.name,
      status: 'ERROR',
      latency: Date.now() - start,
      error: err.message,
    };
  }
}

// ============================================================
// Main
// ============================================================
async function main() {
  checkKeys();
  const results = await Promise.all([
    ...PROVIDERS.map((p) => checkProvider(p)),
  ]);

  console.log("\n🔍 RÉSULTATS DU PING :");
  console.log(results);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PROVIDERS, checkProvider };
