const { PROVIDERS } = require('./config');

// ============================================================
// Phase 7 : Prompt Lab
// ============================================================

const TEMPERATURES = [0, 0.5, 1];

async function callProvider(provider, prompt, temperature) {
  let headers = { 'Content-Type': 'application/json' };
  let body;
  // HuggingFace n'accepte pas temperature: 0
  const temp = provider.format === 'huggingface' && temperature === 0 ? 0.01 : temperature;

  if (provider.format === 'openai') {
    headers['Authorization'] = `Bearer ${provider.key}`;
    body = JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: temp,
    });
  } else {
    headers['Authorization'] = `Bearer ${provider.key}`;
    body = JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 150, temperature: temp },
    });
  }

  try {
    if (!provider.key) {
      return { provider: provider.name, temperature, content: null, error: 'Clé API manquante' };
    }

    const res = await fetch(provider.url, { method: 'POST', headers, body });

    if (!res.ok) {
      return { provider: provider.name, temperature, content: null, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    let content = null;
    if (provider.format === 'openai') {
      content = data.choices?.[0]?.message?.content?.trim() || null;
    } else {
      const generated = data[0]?.generated_text || '';
      content = generated.replace(prompt, '').trim() || null;
    }

    return { provider: provider.name, temperature, content };
  } catch (err) {
    return { provider: provider.name, temperature, content: null, error: err.message };
  }
}

async function main() {
  const prompt = process.argv.slice(2).join(' ') || 'Explique ce qu\'est un cookie HTTP en 2 phrases.';

  console.log(`🧪 Prompt Lab — "${prompt}"\n`);

  // Générer toutes les combinaisons avec flatMap
  const tasks = PROVIDERS.flatMap((provider) =>
    TEMPERATURES.map((temp) => callProvider(provider, prompt, temp))
  );

  const results = await Promise.all(tasks);

  // Affichage
  for (const r of results) {
    const name = r.provider.padEnd(14);
    const temp = `temp ${r.temperature.toFixed(1)}`.padEnd(10);
    if (r.error) {
      console.log(`${name} | ${temp} | ❌ ${r.error}`);
    } else {
      const full = r.content || '(vide)';
      const display = full.length > 80 ? full.substring(0, 80) + '...' : full;
      console.log(`${name} | ${temp} | ${display}`);
    }
  }
}

main().catch(console.error);

module.exports = { callProvider, PROVIDERS, TEMPERATURES };
