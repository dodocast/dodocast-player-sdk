import { test } from 'node:test'
import assert from 'node:assert/strict'
import { watchUrl, embedUrl, embedHtml, streamUrl, getChannelGuide, getChannelState, progress } from '../dist/index.js'

test('watch and embed URLs per kind', () => {
  assert.equal(watchUrl({ kind: 'video', code: 'abc123XYZ0' }), 'https://watch.dodocast.com/abc123XYZ0')
  assert.equal(embedUrl({ kind: 'playlist', code: 'PL1' }), 'https://watch.dodocast.com/embed/pl/PL1')
  assert.equal(embedUrl({ kind: 'broadcast', code: 'B1' }), 'https://watch.dodocast.com/embed/live/B1')
  assert.equal(watchUrl({ kind: 'channel', code: 'C1' }), 'https://watch.dodocast.com/ch/C1')
})

test('private link secret goes into the path', () => {
  assert.equal(embedUrl({ kind: 'video', code: 'V1', secret: 's3cr3t' }), 'https://watch.dodocast.com/embed/V1/s3cr3t')
})

test('start time for videos, item for playlists', () => {
  assert.equal(watchUrl({ kind: 'video', code: 'V1', start: 95.7 }), 'https://watch.dodocast.com/V1?t=95')
  assert.equal(watchUrl({ kind: 'video', code: 'V1', start: 0 }), 'https://watch.dodocast.com/V1')
  assert.equal(embedUrl({ kind: 'playlist', code: 'P1', item: 'I2' }), 'https://watch.dodocast.com/embed/pl/P1?item=I2')
  assert.throws(() => watchUrl({ kind: 'channel', code: 'C1', start: 10 }), TypeError)
  assert.throws(() => watchUrl({ kind: 'video', code: 'V1', item: 'x' }), TypeError)
})

test('bad codes are rejected', () => {
  assert.throws(() => watchUrl({ kind: 'video', code: '../x' }), TypeError)
  assert.throws(() => embedUrl({ kind: 'video', code: 'V1', secret: 'a b' }), TypeError)
})

test('custom hosts', () => {
  assert.equal(embedUrl({ kind: 'video', code: 'V1', hosts: { watch: 'https://w.example.com/' } }), 'https://w.example.com/embed/V1')
})

test('embed code matches the console', () => {
  const r = embedHtml({ kind: 'video', code: 'V1' })
  assert.match(r, /^<div style="position:relative;padding-top:56\.25%;width:100%">/)
  assert.match(r, /allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write; screen-wake-lock;"/)
  assert.match(r, /title="dodocast player"/)
  assert.match(embedHtml({ kind: 'video', code: 'V1', aspect: [9, 16] }), /padding-top:177\.78%/)
  const f = embedHtml({ kind: 'video', code: 'V1', mode: 'fixed', width: 640, height: 360 })
  assert.match(f, /width="640" height="360"/)
})

test('stream URLs', () => {
  assert.equal(streamUrl({ kind: 'video', code: 'V1' }), 'https://stream.dodocast.com/hls/mp4/V1/master.m3u8')
  assert.equal(streamUrl({ kind: 'video', code: 'V1', format: 'byte-range' }), 'https://stream.dodocast.com/hls/mp4-byte-range/V1/master.m3u8')
  assert.equal(streamUrl({ kind: 'channel', code: 'C1', format: 'ts' }), 'https://stream.dodocast.com/ch/ts/C1/master.m3u8')
  assert.equal(streamUrl({ kind: 'broadcast', code: 'B1', token: 'a.b.c' }), 'https://stream.dodocast.com/s/a.b.c/live/mp4/B1/master.m3u8')
  assert.throws(() => streamUrl({ kind: 'channel', code: 'C1', format: 'byte-range' }), TypeError)
})

test('channel data endpoints', async () => {
  const calls = []
  const fake = async (url) => { calls.push(url); return { ok: true, status: 200, json: async () => (url.includes('/epg') ? { entries: [{ title: 'News', startsAtMs: 1, endsAtMs: 2, poster: null }] } : { code: 'C1', serverTimeMs: 5 }) } }
  const guide = await getChannelGuide('C1', { from: 1000, to: 2000, fetch: fake })
  assert.equal(guide[0].title, 'News')
  assert.equal(calls[0], 'https://stream.dodocast.com/public/ch/C1/epg?from=1000&to=2000')
  const state = await getChannelState('C1', { fetch: fake })
  assert.equal(state.code, 'C1')
  assert.equal(calls[1], 'https://stream.dodocast.com/public/ch/C1')
  const nf = async () => ({ ok: false, status: 404, json: async () => ({}) })
  await assert.rejects(getChannelState('C1', { fetch: nf }), /not published/)
})

test('progress uses the server clock', () => {
  assert.equal(progress({ serverTimeMs: 150 }, { startsAtMs: 100, endsAtMs: 200 }), 0.5)
  assert.equal(progress({ serverTimeMs: 999 }, { startsAtMs: 100, endsAtMs: 200 }), 1)
  assert.equal(progress({ serverTimeMs: 150 }, null), 0)
})
