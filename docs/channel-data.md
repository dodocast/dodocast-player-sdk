# Channel data: now/next and the program guide

Two public JSON endpoints of every published 24/7 channel — the building blocks of a widget on your own site.

## State: what is on now and next

`GET https://stream.dodocast.com/public/ch/{code}` → `getChannelState(code)`

```jsonc
{
  "code": "CHxYz12345",
  "title": "Docs 24/7",
  "state": "ON",                 // ON | OFF
  "serverTimeMs": 1791450000000, // trust this, not the viewer’s clock
  "itemCount": 36,
  "totalDurationMs": 47340000,   // one loop of the program
  "encrypted": false,
  "poster": "https://…",         // poster of the current item
  "currentItem": { "code": "abc123XYZ0", "title": "Northern Lights", "durationMs": 92000, "startsAtMs": …, "endsAtMs": … },
  "nextItem":    { "code": "…", "title": "…", "durationMs": …, "startsAtMs": …, "endsAtMs": … },
  "currentShow": { "title": "Evening films", "startsAtMs": …, "endsAtMs": … },  // null in loop mode or between shows
  "nextShow": null,
  "sources": { "mp4": "…/master.m3u8", "ts": "…/master.m3u8" }  // only with access and while on air
}
```

`durationMs` of an item is its **air time**: an item may start mid-video or be cut by a scheduled show. `progress(state, state.currentItem)` gives 0…1 for a progress bar.

Poll it every 10–30 seconds; there is no push channel.

## Program guide

`GET https://stream.dodocast.com/public/ch/{code}/epg?from={ms}&to={ms}` → `getChannelGuide(code, { from, to })`

```jsonc
{ "entries": [ { "title": "Evening films", "startsAtMs": …, "endsAtMs": …, "poster": "https://…", "subtitles": ["en", "es"] } ] }
```

- Without `from` / `to`: the next 24 hours. Any window up to two weeks.
- Times are absolute (epoch ms). Show them in the viewer’s time zone; the channel’s own time zone is used only for planning in the console.
- The guide changes when the schedule changes in the console (rebuilt within a minute).

Both endpoints answer **404** until the channel is published.
