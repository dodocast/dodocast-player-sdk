/** What a code points at. Each kind has its own watch page, embed and stream paths. */
export type ContentKind = 'video' | 'playlist' | 'broadcast' | 'channel'

/** HLS packaging. `byte-range` exists for videos only; broadcasts and channels are sliding windows. */
export type HlsFormat = 'mp4' | 'ts' | 'byte-range'

export interface Hosts {
  /** Public watch pages and embeds. */
  watch: string
  /** Streams (HLS) and public JSON data. */
  stream: string
}

export interface LinkOptions {
  kind: ContentKind
  /** The code shown in the console for the video, playlist, broadcast or channel. */
  code: string
  /** Secret of a private link (access “Private link”): goes into the path, not the query. */
  secret?: string
  /** Videos only: start position in seconds. */
  start?: number
  /** Playlists only: code of the item to open first. */
  item?: string
  hosts?: Partial<Hosts>
}

export interface EmbedOptions extends LinkOptions {
  /** `responsive` (default) keeps the aspect ratio and fills the width; `fixed` uses width × height. */
  mode?: 'responsive' | 'fixed'
  /** Responsive mode: aspect ratio as [width, height]. Default [16, 9]. */
  aspect?: [number, number]
  /** Fixed mode: size in px. Default 1280 × 720. */
  width?: number
  height?: number
  /** Accessible name of the iframe. Default: “dodocast player”. */
  title?: string
}

export interface StreamUrlOptions {
  kind: Exclude<ContentKind, 'playlist'>
  code: string
  format?: HlsFormat
  /** Signed-link JWT for content that is not public (see `signLink` in the server module). */
  token?: string
  hosts?: Partial<Hosts>
}

/** Channel state: what is on now and next (`GET {stream}/public/ch/{code}`). */
export interface ChannelState {
  code: string
  title: string | null
  description: string | null
  tags: string[]
  state: 'ON' | 'OFF'
  /** Server time of the response, ms. Trust it over the viewer’s clock. */
  serverTimeMs: number
  itemCount: number
  /** Length of one loop of the program, ms. */
  totalDurationMs: number
  encrypted: boolean
  poster: string | null
  currentItem: ChannelItem | null
  nextItem: ChannelItem | null
  /** Scheduled show on air now; null in loop mode or between shows. */
  currentShow?: ChannelShow | null
  nextShow?: ChannelShow | null
  /** Present only when the viewer has access and the channel is on air. */
  sources?: { mp4: string; ts: string } | null
}

export interface ChannelItem {
  code: string
  title: string | null
  /** Air time of this item (it may start mid-video or be cut by a show), ms. */
  durationMs: number | null
  startsAtMs?: number | null
  endsAtMs?: number | null
}

export interface ChannelShow {
  title: string | null
  startsAtMs: number
  endsAtMs: number
}

/** One entry of the program guide (`GET {stream}/public/ch/{code}/epg`). */
export interface GuideEntry {
  title: string | null
  startsAtMs: number
  endsAtMs: number
  poster: string | null
  /** Subtitle languages available for the whole entry; empty = none. */
  subtitles?: string[]
}

export interface GuideOptions {
  /** Window start, ms since epoch. Default: now. */
  from?: number
  /** Window end, ms since epoch. Default: 24 h ahead. The window can be up to two weeks. */
  to?: number
  hosts?: Partial<Hosts>
  /** Custom fetch (tests, SSR). Default: global fetch. */
  fetch?: typeof fetch
}
