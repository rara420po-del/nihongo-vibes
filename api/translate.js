export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tweet, lang } = req.body;
  if (!tweet || !lang) return res.status(400).json({ error: 'Missing params' });

  const langNames = {
    en:'English', ja:'Japanese', es:'Spanish', fr:'French', de:'German',
    pt:'Portuguese', ko:'Korean', zh:'Chinese (Simplified)', ar:'Arabic',
    hi:'Hindi', id:'Indonesian', th:'Thai', ru:'Russian'
  };
  const langName = langNames[lang] || 'English';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You help a site that curates funny viral Japanese tweets for international audiences.

Japanese tweet: "${tweet}"

Provide:
1. A natural translation into ${langName} preserving the humor
2. A short cultural context note (1-2 sentences) explaining why it's funny

Reply ONLY with this JSON (no markdown):
{"translation":"...","context":"💡 Context: ..."}`
        }]
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
