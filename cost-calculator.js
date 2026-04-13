const { PRICING } = require('./config');

// ============================================================
// Phase 6 : Cost Calculator
// ============================================================

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function estimateCostData(text) {
  const tokens = estimateTokens(text);
  return PRICING.map((p) => ({
    provider: p.provider,
    tokens,
    costPerRequest: (tokens / 1_000_000) * p.costPerMillionTokens,
    costPer1000: (tokens / 1_000_000) * p.costPerMillionTokens * 1000,
  }));
}

function estimateCost(text, label) {
  const tokens = estimateTokens(text);
  console.log(`Texte${label ? ' (' + label + ')' : ''} : ${text.length} caractères → ~${tokens} tokens\n`);
  console.log('Provider'.padEnd(18) + 'Coût estimé (input)'.padEnd(22) + 'Pour 1000 requêtes');
  console.log('-'.repeat(18) + '-'.repeat(22) + '-'.repeat(18));

  for (const p of PRICING) {
    const cost = (tokens / 1_000_000) * p.costPerMillionTokens;
    const cost1000 = cost * 1000;
    console.log(
      `${p.provider.padEnd(18)}${cost.toFixed(8)}€`.padEnd(40) + `${cost1000.toFixed(5)}€`
    );
  }
}

// Main : prend le texte en argument ou utilise un exemple
if (require.main === module) {
  const textArg = process.argv.slice(2).join(' ');
  const text = textArg || 'Le machine learning est une branche de l\'intelligence artificielle qui permet aux systèmes d\'apprendre automatiquement à partir de données sans être explicitement programmés. Cette approche est utilisée dans de nombreux domaines.';
  estimateCost(text);
}

module.exports = { estimateTokens, estimateCost, estimateCostData, PRICING };
