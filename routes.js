const express = require('express');
const router = express.Router();
const { PROVIDERS, callProvider } = require('./config');
const { checkProvider, checkPinecone } = require('./check-connections');
const { estimateTokens, estimateCostData } = require('./cost-calculator');

// GET /check — lance les checks de connexion, renvoie le JSON
router.get('/check', async (req, res) => {
  try {
    const results = await Promise.all([
      ...PROVIDERS.map((p) => checkProvider(p)),
      checkPinecone(),
    ]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /ask?q=...&provider=mistral — envoie le prompt au provider demandé
router.get('/ask', async (req, res) => {
  const { q, provider: providerName } = req.query;
  if (!q || !providerName) {
    return res.status(400).json({ error: 'Les paramètres "q" et "provider" sont requis' });
  }

  const provider = PROVIDERS.find(
    (p) => p.name.toLowerCase() === providerName.toLowerCase()
  );

  if (!provider) {
    return res.status(400).json({ error: `Provider "${providerName}" inconnu.` });
  }

  try {
    const result = await callProvider(provider, q);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ provider: provider.name, response: result.content });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /cost?text=... — estime les coûts pour le texte donné
router.get('/cost', (req, res) => {
  const { text } = req.query;

  if (!text) {
    return res.status(400).json({ error: 'Paramètre "text" requis' });
  }

  const tokens = estimateTokens(text);
  const costs = estimateCostData(text);

  res.json(
    costs.map((c) => ({
      provider: c.provider,
      tokens: c.tokens,
      estimatedCost: `${c.costPerRequest.toFixed(8)}€`,
    }))
  );
});

module.exports = router;
