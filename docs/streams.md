# Direct streams

For your own player, Smart TV apps or set-top boxes. Direct links are available from the **Pro** plan.

| Kind | fMP4/CMAF | MPEG-TS | byte-range |
|---|---|---|---|
| video | `/hls/mp4/{code}/master.m3u8` | `/hls/ts/{code}/master.m3u8` | `/hls/mp4-byte-range/{code}/master.m3u8` |
| broadcast | `/live/mp4/{code}/master.m3u8` | `/live/ts/{code}/master.m3u8` | — |
| 24/7 channel | `/ch/mp4/{code}/master.m3u8` | `/ch/ts/{code}/master.m3u8` | — |

All on `https://stream.dodocast.com`.

```js
import { streamUrl } from '@dodocast/player'

streamUrl({ kind: 'channel', code: 'CHxYz12345', format: 'ts' })
// https://stream.dodocast.com/ch/ts/CHxYz12345/master.m3u8
```

## Public and private content

- **Public** content plays from a bare link.
- **Anything else** answers 403 to a bare link. Sign it on your server and pass the token: `streamUrl({ …, token })` puts it into the path as `/s/{jwt}/…`. The player requests renditions, segments and the encryption key with the same prefix automatically. See [signed links](signed-links.md).

## Encrypted content

Videos and channels can be encrypted with HLS AES-128 or SAMPLE-AES (ClearKey). hls.js and Safari handle AES-128: the key URI is inside the manifest. Check SAMPLE-AES on your target devices before you rely on it. This protects against simple downloading, it is not DRM.

## Analytics

Retention and completion are measured by the dodocast player. Views in your own player are counted as traffic only.
