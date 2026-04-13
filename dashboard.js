const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { PROVIDERS } = require('./config');

const { checkProvider, checkPinecone } = require('./check-connections');
const { stressTest } = require('./stress-test');
const { compareProviders } = require('./comparateur');
const { VARIATIONS, callWithPrompt } = require('./prompt-sensitivity');
const { QUESTIONS, callWithLanguage } = require('./multi-langue');

function generateDashboard(allResults) {
  const { connections, stress, comparison, sensitivity, multiLang } = allResults;

  const providerNames = PROVIDERS.map(p => p.name);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - Check Connections</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
    h1 { text-align: center; margin-bottom: 2rem; font-size: 2rem; color: #38bdf8; }
    h2 { margin: 2rem 0 1rem; color: #7dd3fc; border-bottom: 1px solid #1e3a5f; padding-bottom: 0.5rem; }
    .section { background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #334155; color: #94a3b8; text-align: left; padding: 0.75rem 1rem; font-size: 0.85rem; text-transform: uppercase; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #334155; }
    .ok { color: #4ade80; }
    .error { color: #f87171; }
    .warn { color: #fbbf24; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
    .badge-ok { background: #166534; color: #4ade80; }
    .badge-err { background: #7f1d1d; color: #f87171; }
    .badge-warn { background: #78350f; color: #fbbf24; }
    .summary { text-align: center; padding: 1rem; font-size: 1.2rem; margin-top: 1rem; }
    .timestamp { text-align: center; color: #64748b; font-size: 0.85rem; margin-top: 2rem; }
  </style>
</head>
<body>
  <h1>🔍 Dashboard Check-Connections</h1>

  <!-- Section 1: Connexions -->
  <div class="section">
    <h2>📡 Connexions API</h2>
    <table>
      <tr><th>Provider</th><th>Statut</th><th>Latence</th><th>Erreur</th></tr>
      ${connections.map(c => `
      <tr>
        <td>${c.provider}</td>
        <td><span class="badge ${c.status === 'OK' ? 'badge-ok' : 'badge-err'}">${c.status}</span></td>
        <td><span style="color: ${c.latency < 500 ? '#4ade80' : c.latency < 1500 ? '#fbbf24' : '#f87171'}">${c.latency}ms</span></td>
        <td>${c.error || '-'}</td>
      </tr>`).join('')}
    </table>
    <div class="summary">
      ${connections.filter(c => c.status === 'OK').length}/${connections.length} connexions actives
    </div>
  </div>

  <!-- Section 2: Stress Test -->
  <div class="section">
    <h2>⚡ Stress Test (10 requêtes parallèles)</h2>
    <table>
      <tr><th>Provider</th><th>Succès</th><th>Échecs</th><th>Latence moy.</th><th>P95</th><th>Erreurs</th></tr>
      ${stress.map(s => {
        const badgeClass = s.failed === 0 ? 'badge-ok' : s.failed < 10 ? 'badge-warn' : 'badge-err';
        return `
      <tr>
        <td>${s.provider}</td>
        <td><span class="badge ${badgeClass}">${s.success}/10</span></td>
        <td>${s.failed}</td>
        <td>${s.avgLatency}ms</td>
        <td>${s.p95}ms</td>
        <td>${s.errors.length > 0 ? s.errors.join(', ') : '-'}</td>
      </tr>`;
      }).join('')}
    </table>
  </div>

  <!-- Section 3: Comparaison providers -->
  <div class="section">
    <h2>🏆 Comparaison des providers</h2>
    <table>
      <tr><th>Type</th>${providerNames.map(n => `<th>${n}</th>`).join('')}</tr>
      ${comparison.map(row => `
      <tr>
        <td><strong>${row.type}</strong></td>
        ${providerNames.map(n => {
          const cell = row[n];
          if (!cell || cell.error) return `<td class="error">${cell ? cell.error : '-'}</td>`;
          return `<td>${escapeHtml((cell.content || '').substring(0, 80))}${(cell.content || '').length > 80 ? '...' : ''}<br><span style="color:#94a3b8;font-size:0.75rem">${cell.latency}ms</span></td>`;
        }).join('')}
      </tr>`).join('')}
    </table>
  </div>

  <!-- Section 4: Sensibilité du prompt -->
  <div class="section">
    <h2>📊 Sensibilité du prompt (Mistral, temp 0.3)</h2>
    <table>
      <tr><th>Formulation</th><th>Tokens</th><th>Longueur</th><th>Première phrase</th></tr>
      ${sensitivity.map(s => `
      <tr>
        <td>"${escapeHtml(s.prompt)}"</td>
        <td>${s.error ? 'ERR' : s.tokens}</td>
        <td>${s.error ? '-' : s.length + ' cars'}</td>
        <td>${s.error ? s.error : '"' + escapeHtml(s.firstSentence || '') + '"'}</td>
      </tr>`).join('')}
    </table>
  </div>

  <!-- Section 5: Multi-langue -->
  <div class="section">
    <h2>🌍 Multi-langue (Mistral)</h2>
    <table>
      <tr><th>Langue</th><th>Tokens input</th><th>Tokens output</th><th>Coût estimé</th></tr>
      ${multiLang.map(m => `
      <tr>
        <td>${m.langue}</td>
        <td>${m.error ? 'ERR' : m.tokensInput}</td>
        <td>${m.error ? '-' : m.tokensOutput}</td>
        <td>${m.error ? '-' : '$' + m.cost.toFixed(5)}</td>
      </tr>`).join('')}
    </table>
  </div>

  <div class="timestamp">Généré le ${new Date().toLocaleString('fr-FR')}</div>
</body>
</html>`;

  fs.writeFileSync('results.html', html, 'utf-8');
  console.log('✅ Fichier results.html généré avec succès !');

  // AUTO-OPEN
  const platform = os.platform();
  const command = platform === 'win32' ? 'start' : platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${command} results.html`);
  console.log('🌐 Ouverture dans le navigateur...');
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function main() {
  console.log('📊 Génération du dashboard...\n');

  // 1. Connexions
  console.log('  → Vérification des connexions...');
  const connections = await Promise.all([
    ...PROVIDERS.map(p => checkProvider(p)),
    checkPinecone(),
  ]);

  // 2. Stress test (10 requêtes)
  console.log('  → Stress test (10 requêtes)...');
  const stress = [];
  for (const p of PROVIDERS) {
    stress.push(await stressTest(p, 10));
  }

  // 3. Comparaison providers
  console.log('  → Comparaison des providers...');
  const comparison = await compareProviders();

  // 4. Sensibilité
  console.log('  → Sensibilité du prompt...');
  const sensitivity = await Promise.all(VARIATIONS.map(p => callWithPrompt(p)));

  // 5. Multi-langue
  console.log('  → Multi-langue...');
  const multiLang = await Promise.all(QUESTIONS.map(q => callWithLanguage(q)));

  generateDashboard({ connections, stress, comparison, sensitivity, multiLang });
}

main().catch(console.error);
