// api/likes.js — いいね数をJSONBinに永続保存

const BIN_ID_KEY = 'JSONBIN_BIN_ID'; // Vercel環境変数に保存するBin ID

async function getBinId() {
  return process.env.JSONBIN_BIN_ID || null;
}

async function initBin(apiKey) {
  // 初回：新しいBinを作成
  const res = await fetch('https://api.jsonbin.io/v3/b', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': apiKey,
      'X-Bin-Name': 'nihongo-vibes-likes',
      'X-Bin-Private': 'false'
    },
    body: JSON.stringify({ likes: {} })
  });
  const data = await res.json();
  return data.metadata?.id || null;
}

async function readLikes(apiKey, binId) {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
    headers: { 'X-Master-Key': apiKey }
  });
  const data = await res.json();
  return data.record?.likes || {};
}

async function writeLikes(apiKey, binId, likes) {
  await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': apiKey
    },
    body: JSON.stringify({ likes })
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.JSONBIN_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'No API key' });

  let binId = await getBinId();

  // GET: いいね数を取得
  if (req.method === 'GET') {
    try {
      if (!binId) return res.status(200).json({ likes: {} });
      const likes = await readLikes(apiKey, binId);
      return res.status(200).json({ likes });
    } catch(e) {
      return res.status(200).json({ likes: {} });
    }
  }

  // POST: いいねを更新
  if (req.method === 'POST') {
    const { cardId, flag, action } = req.body; // action: 'like' or 'unlike'
    if (!cardId || !flag) return res.status(400).json({ error: 'Missing params' });

    try {
      // Binがなければ作成
      if (!binId) {
        binId = await initBin(apiKey);
        if (!binId) return res.status(500).json({ error: 'Could not create bin' });
        // BIN IDをレスポンスで返す（フロントで環境変数に設定するよう促す）
      }

      const likes = await readLikes(apiKey, binId);
      const key = `${cardId}_${flag}`;

      if (action === 'like') {
        likes[key] = (likes[key] || 0) + 1;
      } else if (action === 'unlike') {
        likes[key] = Math.max(0, (likes[key] || 1) - 1);
        if (likes[key] === 0) delete likes[key];
      }

      await writeLikes(apiKey, binId, likes);
      return res.status(200).json({ likes, binId });
    } catch(e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to update likes' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
