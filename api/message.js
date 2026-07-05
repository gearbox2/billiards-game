const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    if (req.method === 'GET') {
      const data = await redis.get('billiards:message');
      res.status(200).json({
        title:   data?.title   ?? 'Welcome!',
        body:    data?.body    ?? 'Use the ghost ball to aim your shot. Drag CB or OB to reposition. Press Space to shoot.',
        updated: data?.updated ?? null,
      });

    } else if (req.method === 'POST') {
      // Simple password check — set ADMIN_PASSWORD in Vercel env vars
      const { title, body, password } = req.body;
      if (!password || password !== process.env.ADMIN_PASSWORD) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (!title || !body) {
        res.status(400).json({ error: 'title and body are required' });
        return;
      }
      const data = { title, body, updated: new Date().toISOString() };
      await redis.set('billiards:message', data);
      res.status(200).json({ ok: true, data });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('message API error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
