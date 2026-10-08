import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { signToken, signedStreamUrl, signedPlaylistItemUrl, MAX_TTL_SECONDS } from '../dist/server.js'

const key = { id: 'sk_test', secret: 'not-a-real-secret' }
const decode = (part) => JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString())

test('token layout: header kid, payload code/iat/exp, HS256 over the secret as a string', () => {
  const t = signToken(key, { code: 'abc123XYZ0', ttl: 1800, now: 1_700_000_000 })
  const [h, p, s] = t.split('.')
  assert.deepEqual(decode(h), { alg: 'HS256', typ: 'JWT', kid: 'sk_test' })
  assert.deepEqual(decode(p), { code: 'abc123XYZ0', iat: 1_700_000_000, exp: 1_700_001_800 })
  const expected = createHmac('sha256', key.secret).update(`${h}.${p}`).digest('base64url')
  assert.equal(s, expected)
  assert.ok(!t.includes('='), 'base64url without padding')
})

test('ttl is capped at 24 h and must be positive', () => {
  assert.equal(MAX_TTL_SECONDS, 86400)
  assert.doesNotThrow(() => signToken(key, { code: 'A', ttl: 86400 }))
  assert.throws(() => signToken(key, { code: 'A', ttl: 86401 }), RangeError)
  assert.throws(() => signToken(key, { code: 'A', ttl: 0 }), RangeError)
})

test('no purpose claim, only code/iat/exp', () => {
  const p = decode(signToken(key, { code: 'A', now: 1 }).split('.')[1])
  assert.deepEqual(Object.keys(p).sort(), ['code', 'exp', 'iat'])
})

test('signed URLs', () => {
  const u = signedStreamUrl(key, { kind: 'video', code: 'V1', now: 1 })
  assert.match(u, /^https:\/\/stream\.dodocast\.com\/s\/[^/]+\.[^/]+\.[^/]+\/hls\/mp4\/V1\/master\.m3u8$/)
  const pl = signedPlaylistItemUrl(key, { code: 'P1', item: 'I1', now: 1 })
  assert.match(pl, /^https:\/\/stream\.dodocast\.com\/public\/pl\/P1\/item\/I1\?t=/)
})
