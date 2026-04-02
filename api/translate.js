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
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Translate this Japanese tweet naturally into ${langName}. Preserve the humor and tone. Reply ONLY with the translation text, nothing else — no explanations, no notes, no context.

Japanese tweet: "${tweet}"`
        }]
      })
    });

    const data = await response.json();
    const translation = data.content?.map(b => b.text || '').join('').trim() || '—';
    res.status(200).json({ translation });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Translation failed' });
  }
}
