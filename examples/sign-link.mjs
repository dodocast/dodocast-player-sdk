// A tiny backend that hands out signed links. Run: DODOCAST_KEY_ID=… DODOCAST_KEY_SECRET=… node examples/sign-link.mjs
// Then GET http://localhost:8787/link?code=abc123XYZ0 — check the viewer’s rights before signing in real code.
import { createServer } from 'node:http'
import { signedStreamUrl } from '../dist/server.js'

const key = { id: process.env.DODOCAST_KEY_ID, secret: process.env.DODOCAST_KEY_SECRET }
if (!key.id || !key.secret) throw new Error('Set DODOCAST_KEY_ID and DODOCAST_KEY_SECRET')

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname !== '/link') { res.writeHead(404).end(); return }
  try {
    const link = signedStreamUrl(key, { kind: 'video', code: url.searchParams.get('code') ?? '', ttl: 1800 })
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ url: link }))
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: String(e.message) }))
  }
}).listen(8787, () => console.log('http://localhost:8787/link?code=abc123XYZ0'))
