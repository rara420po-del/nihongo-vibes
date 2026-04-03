export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.JSONBIN_API_KEY;
  const binId  = process.env.JSONBIN_BIN_ID;
  if (!apiKey || !binId) return res.status(500).json({ error: 'Missing config' });

  // GET: 全データ取得
  if (req.method === 'GET') {
    try {
      const r = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: { 'X-Master-Key': apiKey }
      });
      const data = await r.json();
      return res.status(200).json({ likes: data.record?.likes || {} });
    } catch(e) {
      return res.status(200).json({ likes: {} });
    }
  }

  // POST: いいね更新
  if (req.method === 'POST') {
    const { cardId, flag, action } = req.body;
    // cardId は "1_goat" や "3_ohno" の形式
    if (!cardId || !flag || !action) return res.status(400).json({ error: 'Missing params' });

    try {
      // 現在のデータ取得
      const r = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: { 'X-Master-Key': apiKey }
      });
      const data = await r.json();
      const likes = data.record?.likes || {};

      // キー形式: "1_goat_🇯🇵" など
      const key = `${cardId}_${flag}`;

      if (action === 'like') {
        likes[key] = (likes[key] || 0) + 1;
      } else if (action === 'unlike') {
        likes[key] = Math.max(0, (likes[key] || 1) - 1);
        if (likes[key] === 0) delete likes[key];
      }

      // 保存
      await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey
        },
        body: JSON.stringify({ likes })
      });

      return res.status(200).json({ likes });
    } catch(e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
