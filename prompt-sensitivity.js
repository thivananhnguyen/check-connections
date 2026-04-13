const { MISTRAL_CONFIG, SENSITIVITY_VARIATIONS } = require('./config');

// ============================================================
// Phase 12 : Sensibilité du prompt
// ============================================================

const PROVIDER = MISTRAL_CONFIG;
const VARIATIONS = SENSITIVITY_VARIATIONS;

async function callWithPrompt(prompt) {
  if (!PROVIDER.key) {
    return { prompt, content: null, tokens: 0, length: 0, error: 'Clé API manquante' };
  }

  const res = await fetch(PROVIDER.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PROVIDER.key}`,
    },
    body: JSON.stringify({
      model: PROVIDER.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    return { prompt, content: null, tokens: 0, length: 0, error: `HTTP ${res.status}` };
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '';
  const tokens = data.usage?.completion_tokens || Math.ceil(content.length / 4);

  return {
    prompt,
    content,
    tokens,
    length: content.length,
    firstSentence: content.split(/[.!?]/)[0]?.trim() + '...',
  };
}

async function main() {
  console.log(`📊 Sensibilité du prompt (${PROVIDER.name}, temperature 0.3) :\n`);

  const results = await Promise.all(VARIATIONS.map((v) => callWithPrompt(v)));

  // Header
  console.log(
    '| ' +
    'Formulation'.padEnd(35) + ' | ' +
    'Tokens'.padEnd(6) + ' | ' +
    'Longueur'.padEnd(10) + ' | ' +
    'Première phrase'.padEnd(45) + ' |'
  );
  console.log(
    '|' + '-'.repeat(37) + '|' + '-'.repeat(8) + '|' + '-'.repeat(12) + '|' + '-'.repeat(47) + '|'
  );

  for (const r of results) {
    if (r.error) {
      console.log(
        `| ${r.prompt.substring(0, 33).padEnd(35)} | ${'ERR'.padEnd(6)} | ${'-'.padEnd(10)} | ${r.error.padEnd(45)} |`
      );
    } else {
      const first = r.firstSentence.length > 41
        ? r.firstSentence.substring(0, 38) + '..."'
        : '"' + r.firstSentence + '"';
      console.log(
        `| ${('"' + r.prompt.substring(0, 31) + '"').padEnd(35)} | ${String(r.tokens).padEnd(6)} | ${(r.length + ' cars').padEnd(10)} | ${first.padEnd(45)} |`
      );
    }
  }

  console.log('\nObservation : la formulation impacte le ton et la longueur, pas le fond.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VARIATIONS, callWithPrompt };
