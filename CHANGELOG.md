# Changelog

## 0.1.0 — unreleased

- Watch and embed URLs for videos, playlists, broadcasts and 24/7 channels; private-link secret, start time, playlist item.
- Embed code (responsive or fixed) identical to the console’s; `mount()`.
- Direct HLS manifest URLs: fMP4/CMAF, MPEG-TS, byte-range (videos).
- Channel state (now / next) and program guide; `progress()`.
- Server: signed-link JWT (HS256, `kid`, `code`, `iat`, `exp` ≤ 24 h) and signed stream / playlist-item URLs.
