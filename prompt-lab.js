require('dotenv').config();

// ============================================================
// Phase 7 : Prompt Lab
// ============================================================

const PROVIDERS = [
  {
    name: 'Mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY,
    model: 'mistral-small-latest',
    format: 'openai',
  },
  {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    format: 'openai',
  },
  {
    name: 'HuggingFace',
    url: 'https://router.huggingface.co/novita/v3/openai/chat/completions',
    key: process.env.HF_API_KEY,
    model: 'meta-llama/llama-3.1-8b-instruct',
    format: 'openai',
  },
];

const TEMPERATURES = [0, 0.5, 1];

async function callProvider(provider, prompt, temperature) {
  const safeTemp = (provider.name === 'HuggingFace' && temperature === 0) ? 0.01 : temperature;

  let headers = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${provider.key}`
  };
  
  let body;

  if (provider.format === 'openai') {
    body = JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: safeTemp,
      max_tokens: 100
    });
  } else {
    body = JSON.stringify({
      inputs: prompt,
      parameters: { temperature: safeTemp, max_new_tokens: 100 }
    });
  }

  try {
    const res = await fetch(provider.url, { method: 'POST', headers, body });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    let content = "";

    if (provider.format === 'openai') {
      content = data.choices?.[0]?.message?.content || "";
    } else {
      const rawText = data[0]?.generated_text || "";
      content = rawText.startsWith(prompt) 
        ? rawText.slice(prompt.length).trim() 
        : rawText.trim();
    }

    return { provider: provider.name, temperature, content };
  } catch (err) {
    return { provider: provider.name, temperature, error: err.message };
  }
}

async function main() {
  const prompt = process.argv.slice(2).join(' ') || "Explique ce qu'est un cookie HTTP en une phrase.";
  console.log(`🧪 PROMPT LAB - Question: "${prompt}"\n`);
  const tasks = PROVIDERS.flatMap(p => 
    TEMPERATURES.map(t => callProvider(p, prompt, t))
  );

  const results = await Promise.all(tasks);

  results.forEach(r => {
    const name = r.provider.padEnd(12);
    const temp = `| temp ${r.temperature.toFixed(1)}`.padEnd(12);
    const cleanContent = r.content ? r.content.replace(/\n/g, ' ') : "(vide)";
    const text = r.error ? `❌ Error: ${r.error}` : `| ${cleanContent}`;
    
    console.log(`${name} ${temp} ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
  });
}

main().catch(console.error);

module.exports = { callProvider, PROVIDERS, TEMPERATURES };
