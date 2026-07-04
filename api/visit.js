import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
  // Allow requests from any origin (needed for the browser fetch call)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const count = await redis.incr('billiards:visitors')
    res.status(200).json({ count })
  } catch (err) {
    console.error('Redis error:', err)
    res.status(500).json({ error: 'counter unavailable' })
  }
}
