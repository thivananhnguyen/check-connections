const { MISTRAL_CONFIG, MULTI_LANG_QUESTIONS } = require('./config');

// ============================================================
// Phase 13 : Multi-langue
// ============================================================

const PROVIDER = MISTRAL_CONFIG;
const PRICING_INPUT_1M = 0.20;
const PRICING_OUTPUT_1M = 0.60;
const QUESTIONS = MULTI_LANG_QUESTIONS;

async function callWithLanguage(question) {
  if (!PROVIDER.key) {
    return { ...question, tokensInput: 0, tokensOutput: 0, cost: 0, content: null, error: 'Clé API manquante' };
  }

  const res = await fetch(PROVIDER.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PROVIDER.key}`,
    },
    body: JSON.stringify({
      model: PROVIDER.model,
      messages: [{ role: 'user', content: question.prompt }],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    return { ...question, tokensInput: 0, tokensOutput: 0, cost: 0, content: null, error: `HTTP ${res.status}` };
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '';
  const tokensInput = data.usage?.prompt_tokens || Math.ceil(question.prompt.length / 4);
  const tokensOutput = data.usage?.completion_tokens || Math.ceil(content.length / 4);

  const cost = (tokensInput / 1_000_000) * PRICING_INPUT_1M + (tokensOutput / 1_000_000) * PRICING_OUTPUT_1M;

  return {
    ...question,
    tokensInput,
    tokensOutput,
    totalTokens: tokensInput + tokensOutput,
    cost,
    content,
  };
}

async function main() {
  console.log(`🌍 Multi-langue (${PROVIDER.name}, même question) :\n`);

  const results = await Promise.all(QUESTIONS.map((q) => callWithLanguage(q)));

  // Header
  console.log(
    '| ' +
    'Langue'.padEnd(10) + ' | ' +
    'Tokens input'.padEnd(13) + ' | ' +
    'Tokens output'.padEnd(14) + ' | ' +
    'Coût estimé'.padEnd(13) + ' | ' +
    'Qualité (1-5)'.padEnd(14) + ' |'
  );
  console.log(
    '|' + '-'.repeat(12) + '|' + '-'.repeat(15) + '|' + '-'.repeat(16) + '|' + '-'.repeat(15) + '|' + '-'.repeat(16) + '|'
  );

  for (const r of results) {
    if (r.error) {
      console.log(
        `| ${r.langue.padEnd(10)} | ${'ERR'.padEnd(13)} | ${'-'.padEnd(14)} | ${'-'.padEnd(13)} | ${'-'.padEnd(14)} |`
      );
    } else {
      console.log(
        `| ${r.langue.padEnd(10)} | ${String(r.tokensInput).padEnd(13)} | ${String(r.tokensOutput).padEnd(14)} | ${('$' + r.cost.toFixed(5)).padEnd(13)} | ${'—'.padEnd(14)} |`
      );
    }
  }

  // Comparaison FR vs EN
  const fr = results.find((r) => r.langue === 'Français');
  const en = results.find((r) => r.langue === 'English');

  if (fr && en && fr.totalTokens > 0 && en.totalTokens > 0) {
    const diff = Math.round(((fr.totalTokens - en.totalTokens) / en.totalTokens) * 100);
    console.log(`\n💡 FR consomme ${diff > 0 ? diff + '% de tokens en plus' : Math.abs(diff) + '% de tokens en moins'} que EN (au total).`);
  }

  console.log('💡 Colonne qualité : à remplir subjectivement.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { QUESTIONS, callWithLanguage };
