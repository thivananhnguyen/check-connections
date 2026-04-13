require('dotenv').config();

// ============================================================
// Phase 6 : Cost Calculator
// ============================================================

const PRICING = [
  { provider: 'Mistral Small', costPerMillionTokens: 0.20 },
  { provider: 'Groq Llama 3', costPerMillionTokens: 0.05 },
  { provider: 'GPT-4o', costPerMillionTokens: 2.50 },
];

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
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

module.exports = { estimateTokens, estimateCost, PRICING };
