const { PROVIDERS } = require('./config');

// ============================================================
// Phase 11 : Stress Test
// ============================================================

async function singleCall(provider) {
  let headers = { 'Content-Type': 'application/json' };
  let body;

  if (provider.format === 'openai') {
    headers['Authorization'] = `Bearer ${provider.key}`;
    body = JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: 'Dis juste ok' }],
      max_tokens: 5,
    });
  } else {
    headers['Authorization'] = `Bearer ${provider.key}`;
    body = JSON.stringify({
      inputs: 'Dis juste ok',
      parameters: { max_new_tokens: 5 },
    });
  }

  const start = Date.now();
  const res = await fetch(provider.url, { method: 'POST', headers, body });
  const latency = Date.now() - start;

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${errBody ? ' ' + errBody.substring(0, 80) : ''}`);
  }

  return latency;
}

async function stressTest(provider, n = 10) {
  if (!provider.key) {
    return { provider: provider.name, success: 0, failed: n, avgLatency: 0, p95: 0, errors: ['Clé API manquante'] };
  }

  const promises = Array.from({ length: n }, () => singleCall(provider));
  const results = await Promise.allSettled(promises);

  const successes = [];
  const errors = [];

  for (const r of results) {
    if (r.status === 'fulfilled') {
      successes.push(r.value);
    } else {
      errors.push(r.reason.message);
    }
  }

  const avgLatency = successes.length > 0
    ? Math.round(successes.reduce((a, b) => a + b, 0) / successes.length)
    : 0;

  const sorted = [...successes].sort((a, b) => a - b);
  const p95Index = Math.ceil(sorted.length * 0.95) - 1;
  const p95 = sorted.length > 0 ? sorted[Math.max(0, p95Index)] : 0;

  return {
    provider: provider.name,
    success: successes.length,
    failed: errors.length,
    avgLatency,
    p95,
    errors: [...new Set(errors)],
  };
}

async function main() {
  const thresholds = process.argv[2] ? [parseInt(process.argv[2])] : [5, 10, 20];

  for (const n of thresholds) {
    console.log(`⚡ Stress test : ${n} requêtes parallèles\n`);

    for (const provider of PROVIDERS) {
      const result = await stressTest(provider, n);
      const icon = result.failed === 0 ? '✅' : result.failed < n ? '⚠️' : '❌';
      const errorInfo = result.errors.length > 0 ? `  (${result.errors.join(', ')})` : '';
      console.log(
        `${result.provider.padEnd(14)}: ${result.success}/${n} ${icon}  avg ${result.avgLatency}ms  p95 ${result.p95}ms${errorInfo}`
      );
    }

    console.log('');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { stressTest, PROVIDERS };
