/**
 * dodocast player SDK — server part (Node.js 18+): signed links.
 *
 * Your backend decides who may watch and issues a link with a lifetime. The token is a JWT signed with
 * HS256 by a key from the console (Settings → Signing keys):
 *   header  { alg: "HS256", typ: "JWT", kid }
 *   payload { code, iat, exp }        exp − iat ≤ 24 h
 * The secret is used as a string, exactly as the console shows it (not base64-decoded).
 * Never send the secret to a browser.
 */
import { createHmac } from 'node:crypto'
import { streamUrl } from './index.js'
import type { ContentKind, HlsFormat, Hosts } from './types.js'

export const MAX_TTL_SECONDS = 24 * 60 * 60

export interface SigningKey {
  /** Key id (`kid`) from the console, e.g. "sk_…". */
  id: string
  /** Secret as shown once in the console. */
  secret: string
}

export interface SignOptions {
  /** Code of the video, playlist, broadcast or channel. A token for one code does not open another. */
  code: string
  /** Lifetime in seconds, 1…86400. Default 1800 (30 min). */
  ttl?: number
  /** Issue time, seconds since epoch. Default: now. Keep your server clock in sync (≤ 5 min drift). */
  now?: number
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

/** JWT for a signed link. */
export function signToken(key: SigningKey, o: SignOptions): string {
  if (!key?.id || !key?.secret) throw new TypeError('dodocast: signing key needs id and secret')
  if (!/^[A-Za-z0-9_-]+$/.test(o.code)) throw new TypeError(`dodocast: bad code "${o.code}"`)
  const ttl = Math.floor(o.ttl ?? 1800)
  if (!(ttl > 0 && ttl <= MAX_TTL_SECONDS)) throw new RangeError('dodocast: ttl must be 1…86400 seconds')
  const iat = Math.floor(o.now ?? Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: key.id }))
  const payload = b64url(JSON.stringify({ code: o.code, iat, exp: iat + ttl }))
  const signature = b64url(createHmac('sha256', key.secret).update(`${header}.${payload}`).digest())
  return `${header}.${payload}.${signature}`
}

export interface SignedStreamOptions extends SignOptions {
  kind: Exclude<ContentKind, 'playlist'>
  format?: HlsFormat
  hosts?: Partial<Hosts>
}

/** Signed HLS manifest URL: `{stream}/s/{jwt}/hls/mp4/{code}/master.m3u8` (players request the rest with the same prefix). */
export function signedStreamUrl(key: SigningKey, o: SignedStreamOptions): string {
  return streamUrl({ kind: o.kind, code: o.code, format: o.format, hosts: o.hosts, token: signToken(key, o) })
}

/**
 * Playlist (e.g. a course): sign the playlist code; the response returns the config of the item.
 * `{stream}/public/pl/{code}/item/{itemCode}?t={jwt}`
 */
export function signedPlaylistItemUrl(key: SigningKey, o: SignOptions & { item: string; hosts?: Partial<Hosts> }): string {
  if (!/^[A-Za-z0-9_-]+$/.test(o.item)) throw new TypeError(`dodocast: bad item "${o.item}"`)
  const base = { stream: 'https://stream.dodocast.com', ...o.hosts }.stream!.replace(/\/+$/, '')
  return `${base}/public/pl/${o.code}/item/${o.item}?t=${encodeURIComponent(signToken(key, o))}`
}
