# dodocast player SDK

Put the [dodocast](https://dodocast.com) player on your site, build direct stream URLs, show what a 24/7 channel airs now and next, and sign links to private videos on your server.

```bash
npm install @dodocast/player
```

- **Zero dependencies.** The browser part is a few kilobytes of plain functions.
- **Two entry points:** `@dodocast/player` for the browser and Node.js, `@dodocast/player/server` for signing (Node.js 18+ only — a signing secret must never reach a browser).
- **TypeScript types included.**

## What it does

| | Function | Works with |
|---|---|---|
| Watch-page link | `watchUrl()` | videos, playlists, broadcasts, 24/7 channels |
| Embed URL and embed code | `embedUrl()`, `embedHtml()` | same; responsive or fixed size |
| Put the player into the page | `mount()` | same |
| Start at a second / open a playlist item | `start`, `item` options | videos / playlists |
| Private-link access | `secret` option | all |
| Direct HLS manifest for your own player | `streamUrl()` | videos (fMP4/CMAF, MPEG-TS, byte-range), broadcasts and channels (fMP4/CMAF, MPEG-TS) |
| “Now / next” of a channel | `getChannelState()`, `progress()` | 24/7 channels |
| Program guide of a channel | `getChannelGuide()` | 24/7 channels, up to two weeks ahead |
| Signed links (JWT, HS256) | `signToken()`, `signedStreamUrl()`, `signedPlaylistItemUrl()` | all, lifetime up to 24 h |

## Quick start

### Embed a video

```html
<div id="player"></div>
<script type="module">
  import { mount } from 'https://esm.sh/@dodocast/player'
  mount('#player', { kind: 'video', code: 'abc123XYZ0', start: 90 })
</script>
```

Or get the HTML and render it yourself:

```js
import { embedHtml } from '@dodocast/player'

embedHtml({ kind: 'playlist', code: 'PL0aB1cD2e', item: 'abc123XYZ0' })
// <div style="position:relative;padding-top:56.25%;width:100%"><iframe src="https://watch.dodocast.com/embed/pl/PL0aB1cD2e?item=abc123XYZ0" …></iframe></div>

embedHtml({ kind: 'video', code: 'abc123XYZ0', aspect: [9, 16] })  // vertical video
embedHtml({ kind: 'channel', code: 'CHxYz12345', mode: 'fixed', width: 960, height: 540 })
```

The markup is the same as the “Embed” button in the dodocast console. Where an embed may appear is set per video in the console (anywhere, nowhere, or a list of up to 50 domains).

### A “now playing” widget for a 24/7 channel

```js
import { getChannelState, getChannelGuide, progress } from '@dodocast/player'

const state = await getChannelState('CHxYz12345')
if (state.state === 'ON') {
  console.log('Now:', state.currentItem?.title, Math.round(progress(state, state.currentItem) * 100) + '%')
  console.log('Next:', state.nextItem?.title)
}

const guide = await getChannelGuide('CHxYz12345')  // next 24 hours
for (const e of guide) console.log(new Date(e.startsAtMs).toLocaleTimeString(), e.title)
```

The channel must be published; until then both calls fail with “not found or not published”. See [docs/channel-data.md](docs/channel-data.md).

### Your own player (hls.js, Safari)

```js
import Hls from 'hls.js'
import { streamUrl } from '@dodocast/player'

const src = streamUrl({ kind: 'video', code: 'abc123XYZ0' })  // …/hls/mp4/abc123XYZ0/master.m3u8
const video = document.querySelector('video')
if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = src
else { const hls = new Hls(); hls.loadSource(src); hls.attachMedia(video) }
```

Direct links are available from the Pro plan. Content that is not public answers 403 to a bare link — sign it on your server. See [docs/streams.md](docs/streams.md).

### Sign a link on your server

```js
import { signedStreamUrl } from '@dodocast/player/server'

const key = { id: process.env.DODOCAST_KEY_ID, secret: process.env.DODOCAST_KEY_SECRET }
const url = signedStreamUrl(key, { kind: 'video', code: 'abc123XYZ0', ttl: 1800 })
// https://stream.dodocast.com/s/<jwt>/hls/mp4/abc123XYZ0/master.m3u8
```

Create the key in the console: **Settings → Signing keys**. Examples for Python, PHP and Kotlin: [docs/signed-links.md](docs/signed-links.md).

## Not available yet

To keep your expectations right, this is what the player and the SDK **do not** do today:

- **No playback API.** You cannot call `play()`, `pause()` or `seek()` on an embedded player or subscribe to its events. The iframe is the whole integration. Start position (`start`) and playlist item (`item`) are set through the URL.
- **No upload or management API.** Upload and organize videos in the console.
- No DASH, no DRM (Widevine, FairPlay, PlayReady). Encryption is HLS AES-128 / SAMPLE-AES — it protects against simple downloading, it is not DRM.
- No live camera or encoder input (RTMP, SRT, WebRTC): broadcasts and channels air videos you have uploaded.

## Hosts

By default links point at `https://watch.dodocast.com` (watch pages and embeds) and `https://stream.dodocast.com` (streams and channel data). Every function takes `hosts: { watch, stream }` if you need others.

## Docs

- [Embedding](docs/embed.md)
- [Direct streams](docs/streams.md)
- [Channel data: now/next and the program guide](docs/channel-data.md)
- [Signed links](docs/signed-links.md)
- [Examples](examples/)

## License

MIT — see [LICENSE](LICENSE). Questions: hello@dodocast.com.
