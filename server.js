const express = require('express');
const routes = require('./routes');

const app = express();
const PORT = 3000;

// ============================================================
// Phase 9 : Mini-serveur Express
// ============================================================

app.use('/', routes);

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log('Routes disponibles :');
  console.log('  GET /check             → vérifie les connexions');
  console.log('  GET /ask?q=...&provider=...  → appel API');
  console.log('  GET /cost?text=...     → estimation des coûts');
});
