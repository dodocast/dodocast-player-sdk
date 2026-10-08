# Embedding

## URLs

| Kind | Watch page | Embed (iframe) |
|---|---|---|
| video | `https://watch.dodocast.com/{code}` | `https://watch.dodocast.com/embed/{code}` |
| playlist | `/pl/{code}` | `/embed/pl/{code}` |
| broadcast | `/live/{code}` | `/embed/live/{code}` |
| 24/7 channel | `/ch/{code}` | `/embed/ch/{code}` |

- **Private link** (access “Private link” in the console): the secret is the last path segment — `/embed/{code}/{secret}`. Pass it as `secret`. Regenerating the link in the console makes the old one stop working.
- **Start time** (videos): `?t={seconds}` — option `start`.
- **First item** (playlists): `?item={itemCode}` — option `item`.
- **Password**: a password-protected video shows a password form inside the player; nothing to pass in the URL.

The content must be **published** in the console. Unpublished or blocked content shows a placeholder instead of the player.

## Embed code

```js
import { embedHtml, mount } from '@dodocast/player'

embedHtml({ kind: 'video', code: 'abc123XYZ0' })                       // responsive, 16:9
embedHtml({ kind: 'video', code: 'abc123XYZ0', aspect: [4, 3] })       // responsive, 4:3
embedHtml({ kind: 'video', code: 'abc123XYZ0', mode: 'fixed', width: 640, height: 360 })

const player = mount('#player', { kind: 'broadcast', code: 'BRxYz12345' })
player.destroy()  // remove it again
```

The iframe gets `allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write; screen-wake-lock;"` and `allowfullscreen`, like the console’s embed code.

## Where it may appear

Each video, playlist, broadcast and channel has an embedding rule in the console: allowed everywhere, nowhere, or only on a list of up to 50 domains (`*.example.com` works). Settings are inherited from the account to the project and the video. The SDK does not change this rule — set it in the console.

## Player features viewers get

Quality (auto or manual), audio tracks and subtitles, playback speed 0.25–2× (not in live mode), frame preview on the timeline, chapters, “resume where you stopped”, autoplay of the next item in playlists.
