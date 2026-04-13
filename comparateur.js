const { PROVIDERS, callProvider } = require('./config');

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

module.exports = { PROMPTS };
