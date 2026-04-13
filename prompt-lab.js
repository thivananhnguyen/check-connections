const { PROVIDERS, callProvider: _callProvider } = require('./config');

// ============================================================
// Phase 7 : Prompt Lab
// ============================================================

const TEMPERATURES = [0, 0.5, 1];

// Wrapper pour ajouter temperature au résultat
async function callProvider(provider, prompt, temperature) {
  const result = await _callProvider(provider, prompt, { temperature, maxTokens: 150 });
  return { ...result, temperature };
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

module.exports = { callProvider, TEMPERATURES };
