require('dotenv').config();

// ============================================================
// Phase 1 : Vérification des clés API
// ============================================================
const KEYS = [
  { name: 'MISTRAL_API_KEY', value: process.env.MISTRAL_API_KEY },
  { name: 'GROQ_API_KEY', value: process.env.GROQ_API_KEY },
  { name: 'HF_API_KEY', value: process.env.HF_API_KEY },
  { name: 'PINECONE_API_KEY', value: process.env.PINECONE_API_KEY },
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
// Phase 4 : Affichage formaté
// ============================================================
function displayResults(results) {
  console.log('\n🔍 Vérification des connexions API...\n');

  let okCount = 0;

  for (const r of results) {
    const icon = r.status === 'OK' ? '✅' : '❌';
    const name = r.provider.padEnd(16);
    const latency = r.latency ? `${r.latency}ms` : '-';
    const extra = r.error ? `  (${r.error})` : '';
    const verboseResponse = r.response ? `  → "${r.response}"` : '';

    console.log(`${icon} ${name} ${latency}${verboseResponse}${extra}`);

    if (r.status === 'OK') okCount++;
  }

  console.log(`\n${okCount}/${results.length} connexions actives`);

  if (okCount === results.length) {
    console.log('Tout est vert. Vous êtes prêts pour la suite !');
  } else {
    console.log('⚠️  Certaines connexions ont échoué. Vérifiez vos clés API.');
  }
}

// ============================================================
// Phase 5 :  Pinecone + modèles disponibles 
// ============================================================
async function checkPinecone() {
  const key = process.env.PINECONE_API_KEY;
  if (!key) {
    return { provider: 'Pinecone', status: 'ERROR', latency: 0, error: 'Clé API manquante' };
  }

  const start = Date.now();
  try {
    const res = await fetch('https://api.pinecone.io/indexes', {
      method: 'GET',
      headers: {
        'Api-Key': key,
        'X-Pinecone-API-Version': '2024-07',
      },
    });
    const latency = Date.now() - start;

    if (!res.ok) {
      return { provider: 'Pinecone', status: 'ERROR', latency, error: `HTTP ${res.status}` };
    }

    return { provider: 'Pinecone', status: 'OK', latency };
  } catch (err) {
    return { provider: 'Pinecone', status: 'ERROR', latency: Date.now() - start, error: err.message };
  }
}

async function listMistralModels() {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) {
    console.log('❌ Impossible de lister les modèles Mistral : clé manquante');
    return;
  }

  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!res.ok) {
      console.log(`❌ Erreur lors de la récupération des modèles Mistral: HTTP ${res.status}`);
      return;
    }

    const data = await res.json();
    console.log('\n Modèles Mistral disponibles :');
    for (const m of (data.data || []).slice(0, 5)) {
    console.log(`   - ${m.id}`);
    }
  } catch (err) {
    console.log(`❌ Erreur réseau pour les modèles Mistral: ${err.message}`);
  }
}

// ============================================================
// Main
// ============================================================
async function main() {
  checkKeys();
  const results = await Promise.all([
    ...PROVIDERS.map((p) => checkProvider(p)),
    checkPinecone(),
  ]);

  displayResults(results);

  if (isVerbose) {
    await listMistralModels();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

// Exports pour réutilisation dans server.js et autres
module.exports = { PROVIDERS, checkProvider, checkPinecone, displayResults, listMistralModels };
