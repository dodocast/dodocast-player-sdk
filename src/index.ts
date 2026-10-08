/**
 * dodocast player SDK — browser-safe part: links, embeds, stream URLs and channel data.
 * No dependencies. Signing lives in `@dodocast/player/server` (Node.js only: never ship a secret to a browser).
 */
import type {
  ChannelState, ContentKind, EmbedOptions, GuideEntry, GuideOptions, Hosts, LinkOptions, StreamUrlOptions
} from './types.js'

export type * from './types.js'

export const DEFAULT_HOSTS: Hosts = {
  watch: 'https://watch.dodocast.com',
  stream: 'https://stream.dodocast.com'
}

/** Same `allow` list as the embed code the console gives you. */
export const IFRAME_ALLOW =
  'autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write; screen-wake-lock;'

const WATCH_SEGMENT: Record<ContentKind, string> = { video: '', playlist: '/pl', broadcast: '/live', channel: '/ch' }
const STREAM_SEGMENT = { video: 'hls', broadcast: 'live', channel: 'ch' } as const
const CODE = /^[A-Za-z0-9_-]+$/

function hosts(h?: Partial<Hosts>): Hosts {
  const out = { ...DEFAULT_HOSTS, ...h }
  return { watch: out.watch.replace(/\/+$/, ''), stream: out.stream.replace(/\/+$/, '') }
}

function checkCode(name: string, value: string): string {
  if (!CODE.test(value)) throw new TypeError(`dodocast: ${name} must be a code like "abc123XYZ0", got "${value}"`)
  return value
}

function pagePath(o: LinkOptions): string {
  const secret = o.secret ? `/${checkCode('secret', o.secret)}` : ''
  return `${WATCH_SEGMENT[o.kind]}/${checkCode('code', o.code)}${secret}`
}

function query(o: LinkOptions): string {
  const q = new URLSearchParams()
  if (o.start !== undefined) {
    if (o.kind !== 'video') throw new TypeError('dodocast: start is supported for videos only')
    const s = Math.floor(o.start)
    if (!(s >= 0)) throw new RangeError('dodocast: start must be a number of seconds ≥ 0')
    if (s > 0) q.set('t', String(s))
  }
  if (o.item !== undefined) {
    if (o.kind !== 'playlist') throw new TypeError('dodocast: item is supported for playlists only')
    q.set('item', checkCode('item', o.item))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

/** Public watch page: `https://watch.dodocast.com/{code}`, `/pl/{code}`, `/live/{code}`, `/ch/{code}`. */
export function watchUrl(o: LinkOptions): string {
  return `${hosts(o.hosts).watch}${pagePath(o)}${query(o)}`
}

/** Player-only page for an iframe: `https://watch.dodocast.com/embed/…`. */
export function embedUrl(o: LinkOptions): string {
  return `${hosts(o.hosts).watch}/embed${pagePath(o)}${query(o)}`
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/** Embed code as a string — the same markup as “Embed” in the console. */
export function embedHtml(o: EmbedOptions): string {
  const src = escapeAttr(embedUrl(o))
  const title = escapeAttr(o.title ?? 'dodocast player')
  if (o.mode === 'fixed') {
    const w = Math.round(o.width ?? 1280)
    const h = Math.round(o.height ?? 720)
    return `<iframe src="${src}" title="${title}" allow="${IFRAME_ALLOW}" frameborder="0" allowfullscreen width="${w}" height="${h}"></iframe>`
  }
  const [aw, ah] = o.aspect ?? [16, 9]
  const pct = aw > 0 && ah > 0 ? (ah / aw) * 100 : 56.25
  return `<div style="position:relative;padding-top:${pct.toFixed(2)}%;width:100%">`
    + `<iframe src="${src}" title="${title}" allow="${IFRAME_ALLOW}" frameborder="0" allowfullscreen `
    + `style="position:absolute;width:100%;height:100%;top:0;left:0;"></iframe></div>`
}

export interface Mounted {
  iframe: HTMLIFrameElement
  /** Removes what `mount` added. */
  destroy(): void
}

/**
 * Puts the player into `target` (an element or a CSS selector).
 * The iframe is the whole API today: there are no playback methods or events yet.
 */
export function mount(target: Element | string, o: EmbedOptions): Mounted {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) throw new Error(`dodocast: mount target not found: ${String(target)}`)
  const box = document.createElement('div')
  box.innerHTML = embedHtml(o)
  const node = box.firstElementChild as HTMLElement
  el.appendChild(node)
  const iframe = (node.tagName === 'IFRAME' ? node : node.querySelector('iframe')) as HTMLIFrameElement
  return { iframe, destroy: () => node.remove() }
}

/**
 * Direct HLS manifest for your own player (direct links are available from the Pro plan).
 * Content that is not public needs a signed-link `token` (server module).
 */
export function streamUrl(o: StreamUrlOptions): string {
  const format = o.format ?? 'mp4'
  if (format === 'byte-range' && o.kind !== 'video') {
    throw new TypeError('dodocast: byte-range is available for videos only')
  }
  const prefix = o.token ? `/s/${encodeURIComponent(o.token)}` : ''
  const fmt = format === 'byte-range' ? 'mp4-byte-range' : format
  return `${hosts(o.hosts).stream}${prefix}/${STREAM_SEGMENT[o.kind]}/${fmt}/${checkCode('code', o.code)}/master.m3u8`
}

async function getJson<T>(url: string, f?: typeof fetch): Promise<T> {
  const res = await (f ?? fetch)(url, { headers: { Accept: 'application/json' } })
  if (res.status === 404) throw new Error(`dodocast: not found or not published: ${url}`)
  if (!res.ok) throw new Error(`dodocast: HTTP ${res.status} for ${url}`)
  return res.json() as Promise<T>
}

/** What a channel airs now and next. Poll it, e.g. every 10–30 s, for a “now playing” widget. */
export function getChannelState(code: string, o: { hosts?: Partial<Hosts>; fetch?: typeof fetch } = {}): Promise<ChannelState> {
  return getJson<ChannelState>(`${hosts(o.hosts).stream}/public/ch/${checkCode('code', code)}`, o.fetch)
}

/** Program guide of a channel: 24 h ahead by default, any window up to two weeks with `from` / `to`. */
export async function getChannelGuide(code: string, o: GuideOptions = {}): Promise<GuideEntry[]> {
  const q = new URLSearchParams()
  if (o.from !== undefined) q.set('from', String(Math.floor(o.from)))
  if (o.to !== undefined) q.set('to', String(Math.floor(o.to)))
  const s = q.toString()
  const data = await getJson<{ entries?: GuideEntry[] }>(
    `${hosts(o.hosts).stream}/public/ch/${checkCode('code', code)}/epg${s ? `?${s}` : ''}`, o.fetch
  )
  return data.entries ?? []
}

/** Progress of the current item or show, 0…1, using the server clock from the state response. */
export function progress(state: Pick<ChannelState, 'serverTimeMs'>, span: { startsAtMs?: number | null; endsAtMs?: number | null } | null | undefined, nowMs?: number): number {
  if (!span?.startsAtMs || !span.endsAtMs || span.endsAtMs <= span.startsAtMs) return 0
  const now = nowMs ?? state.serverTimeMs
  return Math.min(1, Math.max(0, (now - span.startsAtMs) / (span.endsAtMs - span.startsAtMs)))
}
