const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      res.status(400).json({ error: 'Valid email required' });
      return;
    }

    const normalized = email.toLowerCase().trim();

    // Check if already signed up
    const existing = await redis.sismember('billiards:emails', normalized);
    if (existing) {
      res.status(200).json({ ok: true, already: true });
      return;
    }

    // Store in a Redis set (deduplicates automatically)
    await redis.sadd('billiards:emails', normalized);

    // Also store with timestamp in a sorted set for admin view
    await redis.zadd('billiards:emails:log', {
      score: Date.now(),
      member: normalized,
    });

    res.status(200).json({ ok: true, already: false });
  } catch (err) {
    console.error('signup error:', err.message);
    res.status(500).json({ error: 'Signup failed, please try again' });
  }
};
