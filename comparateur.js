const { PROVIDERS } = require('./config');

// ============================================================
// Phase 8 : Comparateur de modèles
// ============================================================

const PROMPTS = [
  { type: 'traduction', prompt: 'Traduis en anglais : "Le chat dort sur le canapé."' },
  { type: 'résumé', prompt: 'Résume en une phrase : "L\'intelligence artificielle est un domaine de l\'informatique qui vise à créer des systèmes capables de simuler l\'intelligence humaine. Elle englobe le machine learning, le deep learning, le traitement du langage naturel et la vision par ordinateur. Ces technologies sont utilisées dans de nombreux secteurs comme la santé, la finance, les transports et le divertissement."' },
  { type: 'code', prompt: 'Écris une fonction JavaScript qui inverse une chaîne de caractères. Donne uniquement le code.' },
  { type: 'créatif', prompt: 'Donne une métaphore originale pour expliquer ce qu\'est un LLM (Large Language Model).' },
  { type: 'factuel', prompt: 'Qui a inventé le Transformer en 2017 ? Réponds en une phrase.' },
];

async function callProvider(provider, prompt) {
  let headers = { 'Content-Type': 'application/json' };
  let body;

  if (provider.format === 'openai') {
    headers['Authorization'] = `Bearer ${provider.key}`;
    body = JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    });
  } else {
    headers['Authorization'] = `Bearer ${provider.key}`;
    body = JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 200, temperature: 0.3 },
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

async function main() {
  console.log('🏆 Comparateur de modèles\n');

  // Toutes les combinaisons en parallèle
  const tasks = PROMPTS.flatMap((p) =>
    PROVIDERS.map((prov) =>
      callProvider(prov, p.prompt).then((r) => ({ ...r, type: p.type }))
    )
  );

  const results = await Promise.all(tasks);

  // Construire le tableau markdown
  const providerNames = PROVIDERS.map((p) => p.name);

  // Header
  const header = `| Type       | ${providerNames.map((n) => n.padEnd(45)).join(' | ')} |`;
  const separator = `|------------|${providerNames.map(() => '-'.repeat(47)).join('|')}|`;

  console.log(header);
  console.log(separator);

  for (const p of PROMPTS) {
    const cells = providerNames.map((name) => {
      const r = results.find((res) => res.type === p.type && res.provider === name);
      if (!r) return '(non disponible)'.padEnd(45);
      if (r.error) return `❌ ${r.error}`.padEnd(45);
      return (r.content || '(vide)').substring(0, 42).padEnd(45);
    });

    console.log(`| ${p.type.padEnd(10)} | ${cells.join(' | ')} |`);
  }

  console.log('');
}

main().catch(console.error);
