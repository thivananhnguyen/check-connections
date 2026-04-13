# Check-Connections

Mini-projet : un outil qui vérifie que toutes vos connexions API fonctionnent, affiche les latences, et vous donne un statut clair avant de coder. Le genre de script qu'on lance au début d'une session de dev pour s'assurer que l'environnement est sain.

## Installation

```bash
npm install
```

## Configuration

1. Copiez `.env.example` en `.env` :
```bash
cp .env.example .env
```

2. Remplissez vos clés API :
- `MISTRAL_API_KEY` → [console.mistral.ai](https://console.mistral.ai/) > API Keys > Create new key
- `GROQ_API_KEY` → [console.groq.com](https://console.groq.com/) > API Keys > Create API Key
- `HF_API_KEY` → [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) > New token (Read)
- `PINECONE_API_KEY` → [app.pinecone.io](https://app.pinecone.io/) > API Keys

## Lancer les scripts

| Phase | Commande | Description |
|-------|----------|-------------|
| 1-5 | `npm run check` | Vérifie les connexions API (Mistral, Groq, HuggingFace, Pinecone) |
| 5 | `npm run check:verbose` | Mode verbose : vérifie que les providers répondent correctement ("Paris") |
| 6 | `npm run cost` | Estime le coût d'un texte par provider |
| 7 | `npm run prompt-lab` | Même prompt × 3 providers × 3 températures (0, 0.5, 1) = 9 réponses |
| 8 | `npm run compare` | Compare 5 types de tâches (traduction, résumé, code, créatif, factuel) sur 3 providers |
| 9 | `npm run server` | Lance le serveur Express sur le port 3000 |
| 10 | `npm run compare-model` | Compare le même modèle sur Groq vs HuggingFace |
| 11 | `npm run stress` | Stress test : 5, 10, 20 requêtes parallèles par provider |
| 12 | `npm run sensitivity` | Teste la sensibilité du prompt : 5 formulations → compare ton et longueur |
| 13 | `npm run multi-lang` | Même question en FR / EN / ES → compare tokens et coûts |
| 14 | `npm run dashboard` | Génère `results.html` avec tous les résultats |

### Exemples

```bash
# Vérification rapide
npm run check

# Vérification avec réponse ("Paris")
npm run check:verbose

# Stress test avec 20 requêtes
node stress-test.js 20

# Prompt lab avec un prompt custom
node prompt-lab.js "Explique ce qu'est un cookie HTTP en 2 phrases."

# Cost calculator avec un texte custom
node cost-calculator.js "Le machine learning est une branche de l'IA"
```

## API du serveur Express (Phase 9)

```bash
npm run server
```

```bash
# Vérifier les connexions
curl http://localhost:3000/check
# → [{ provider: 'Mistral', status: 'OK', latency: 312 }, ...]

# Poser une question à un provider
curl "http://localhost:3000/ask?q=Bonjour&provider=groq"
# → { provider: 'Groq', response: 'Bonjour ! Comment puis-je vous aider ?' }

# Estimer les coûts
curl "http://localhost:3000/cost?text=Bonjour%20monde"
# → [{ provider: 'Mistral Small', tokens: 3, estimatedCost: '0.00000060€' }, ...]
```

## Structure du projet

```
check-connections/
├── .env                    ← clés API (jamais committé)
├── .env.example            ← template des clés
├── .gitignore
├── package.json
├── config.js               ← configuration partagée (providers, pricing, callProvider, ...)
├── check-connections.js    ← Phases 1-5 : vérification connexions + Pinecone + modèles Mistral
├── cost-calculator.js      ← Phase 6 : estimation des coûts par provider
├── prompt-lab.js           ← Phase 7 : même prompt × 3 températures × 3 providers
├── comparateur.js          ← Phase 8 : 5 tâches × 3 providers en tableau markdown
├── server.js               ← Phase 9 : serveur Express
├── routes.js               ← Phase 9 : routes Express (/check, /ask, /cost)
├── compare-same-model.js   ← Phase 10 : même modèle sur Groq vs HuggingFace
├── stress-test.js          ← Phase 11 : stress test avec Promise.allSettled
├── prompt-sensitivity.js   ← Phase 12 : sensibilité aux formulations
├── multi-langue.js         ← Phase 13 : comparaison FR / EN / ES
├── dashboard.js            ← Phase 14 : génère results.html
└── README.md
```

## Checkpoints de test

- ✅ Toutes les clés API correctes (cas nominal)
- ✅ Une clé volontairement invalide → le script affiche ERROR, pas de crash
- ✅ Une clé manquante dans le .env → gestion gracieuse
- ✅ Wifi coupé → erreur réseau distincte de l'erreur d'auth
