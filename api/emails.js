const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Admin-only endpoint to list all signups
// GET /api/emails?password=YOUR_ADMIN_PASSWORD
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).end(); return; }

  const { password } = req.query;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Get all emails ordered by signup time (newest first)
    const entries = await redis.zrange('billiards:emails:log', 0, -1, { rev: true, withScores: true });

    // entries comes back as [member, score, member, score, ...]
    const list = [];
    for (let i = 0; i < entries.length; i += 2) {
      list.push({
        email: entries[i],
        signedUp: new Date(Number(entries[i + 1])).toISOString(),
      });
    }

    res.status(200).json({ count: list.length, emails: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
