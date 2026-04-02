export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { tweet, lang } = req.body;
  if (!tweet || !lang) return res.status(400).json({ error: 'Missing tweet or lang' });
  const langNames = { en:'English', es:'Spanish', fr:'French', de:'German', pt:'Portuguese', ko:'Korean', zh:'Chinese (Simplified)', ar:'Arabic', hi:'Hindi', id:'Indonesian', th:'Thai', ru:'Russian' };
  const langName = langNames[lang] || 'English';
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: `You are helping a site that curates funny and viral Japanese tweets for international audiences.\n\nJapanese tweet: "${tweet}"\n\nProvide:\n1. A natural, fluent translation into ${langName} that captures the humor and nuance\n2. A brief cultural context note (1–2 sentences) explaining why this is funny or culturally significant\n\nRespond ONLY with a JSON object, no markdown:\n{"translation": "...", "context": "💡 Context: ..."}` }]
      })
    });
    const data = await response.json();
    const raw = data.content?.map(b => b.text || '').join('') || '{}';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.status(200).json(parsed);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Translation failed' });
  }
}
