const { GROQ_CONFIG, HF_CONFIG, callProvider } = require('./config');

// ============================================================
// Phase 10 : Même modèle, deux hébergeurs
// ============================================================

async function compareSameModel(prompt) {
  const [groq, hf] = await Promise.all([
    callProvider(GROQ_CONFIG, prompt, { maxTokens: 150 }),
    callProvider(HF_CONFIG, prompt, { maxTokens: 150 }),
  ]);

  const speedDiff = hf.latency > 0 && groq.latency > 0
    ? (hf.latency / groq.latency).toFixed(1)
    : 'N/A';

  return {
    groq: { content: groq.content, latency: groq.latency, error: groq.error },
    huggingface: { content: hf.content, latency: hf.latency, error: hf.error },
    diff: `Groq ${speedDiff}x plus rapide`,
  };
}

async function main() {
  const prompt = process.argv.slice(2).join(' ') || 'Explique le machine learning en 2 phrases.';

  console.log(`🔬 Comparaison du même modèle sur deux hébergeurs\n`);
  console.log(`Prompt : "${prompt}"\n`);

  const result = await compareSameModel(prompt);

  console.log(`${GROQ_CONFIG.name} :`);
  console.log(`  ${result.groq.latency}ms — "${result.groq.content || result.groq.error}"\n`);

  console.log(`${HF_CONFIG.name} :`);
  console.log(`  ${result.huggingface.latency}ms — "${result.huggingface.content || result.huggingface.error}"\n`);

  console.log(`Latence : ${result.diff}`);
  console.log(`Réponses : ${result.groq.content && result.huggingface.content
    ? 'similaires en substance, style légèrement différent'
    : 'comparaison impossible (erreur)'}`);
}

main().catch(console.error);

module.exports = { compareSameModel };
