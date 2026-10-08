# Signed links

Your backend decides who may watch and issues a link with a lifetime. dodocast checks the signature, the code and the lifetime.

1. In the console, **Settings → Signing keys → Create**. The secret is shown **once** — store it like a database password. You can see when a key was last used and revoke it.
2. On your server, sign a JWT and put it into the stream URL.

## Token

```
header:  { "alg": "HS256", "typ": "JWT", "kid": "<key id>" }
payload: { "code": "<video | playlist | broadcast | channel code>", "iat": <unix>, "exp": <unix> }
```

- `code` — a token for one code does not open another.
- `iat` and `exp` are both required; `exp − iat` ≤ **24 hours**.
- You can sign only your own content: the key is checked against the owner.
- The secret is used **as a string**, exactly as the console shows it — not base64-decoded.
- No other claims (a `purpose` claim is rejected).

## Where the token goes

| Kind | URL |
|---|---|
| video | `https://stream.dodocast.com/s/{jwt}/hls/mp4/{code}/master.m3u8` |
| broadcast | `https://stream.dodocast.com/s/{jwt}/live/mp4/{code}/master.m3u8` |
| channel | `https://stream.dodocast.com/s/{jwt}/ch/mp4/{code}/master.m3u8` |
| playlist (e.g. a course) | `https://stream.dodocast.com/public/pl/{code}/item/{itemCode}?t={jwt}` — sign the **playlist** code; the response is the config of that item |

## Node.js — this SDK

```js
import { signedStreamUrl, signedPlaylistItemUrl } from '@dodocast/player/server'

const key = { id: process.env.DODOCAST_KEY_ID, secret: process.env.DODOCAST_KEY_SECRET }
signedStreamUrl(key, { kind: 'video', code: 'abc123XYZ0', ttl: 1800 })
signedPlaylistItemUrl(key, { code: 'PL0aB1cD2e', item: 'abc123XYZ0', ttl: 3600 })
```

## Python (PyJWT)

```python
import jwt, time
now = int(time.time())
token = jwt.encode({"code": "abc123XYZ0", "iat": now, "exp": now + 1800},
                   secret, algorithm="HS256", headers={"kid": key_id})
url = f"https://stream.dodocast.com/s/{token}/hls/mp4/abc123XYZ0/master.m3u8"
```

## PHP (firebase/php-jwt)

```php
use Firebase\JWT\JWT;
$now = time();
$token = JWT::encode(['code' => 'abc123XYZ0', 'iat' => $now, 'exp' => $now + 1800], $secret, 'HS256', $keyId);
$url = "https://stream.dodocast.com/s/$token/hls/mp4/abc123XYZ0/master.m3u8";
```

## Kotlin (jjwt)

```kotlin
val key = Keys.hmacShaKeyFor(secret.toByteArray())
val now = Instant.now()
val jwt = Jwts.builder()
    .header().keyId(keyId).and()
    .claim("code", "abc123XYZ0")
    .issuedAt(Date.from(now))
    .expiration(Date.from(now.plusSeconds(1800)))
    .signWith(key, Jwts.SIG.HS256)
    .compact()
val url = "https://stream.dodocast.com/s/$jwt/hls/mp4/abc123XYZ0/master.m3u8"
```

## If a link does not work

- You signed someone else’s content — the key works only for yours.
- `exp − iat` is more than 24 hours.
- The token has a `purpose` claim.
- The key was revoked (or re-created — check `kid`).
- Your server clock is more than 5 minutes ahead.
