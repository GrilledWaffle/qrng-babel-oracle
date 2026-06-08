# QRNG · Babel Oracle

A browser-only experiment that fuses your typed question with **live quantum
entropy** from the [ANU QRNG](https://quantumnumbers.anu.edu.au/), measures
both streams against an in-page predictor, and projects the result into a
clickable address inside the [Library of Babel](https://libraryofbabel.info/).

Built around the information-theory ideas in 3Blue1Brown's compression
trilogy: *prediction and compression are two sides of the same coin*. The
app makes that duality tangible — your input is predictable (low entropy),
the QRNG is maxent, and the XOR fusion + the divergence meters let you see
how much the quantum stream washes away of the predictable structure.

## Quick start

```bash
git clone <this repo>
cd qrng-babel-oracle
cp .env.example .env.local        # paste your ANU key (or leave blank to use UI field)
npm install
npm run dev
```

Opens at `http://localhost:5173`. Paste your key in the page (it's stored in
`localStorage` only) or set `VITE_ANU_QRNG_KEY` in `.env.local`.

If the QRNG call fails (no key, key revoked, network), the app **transparently
falls back to `crypto.getRandomValues`** and labels the source clearly. You'll
always see whether you got real quantum bits or just CSPRNG.

## What it shows

- **Input bits**, **quantum bits**, **fused bits** (`input ⊕ qrng`)
- All three rendered as Babel-alphabet text
- Per-stream bit-bias, char entropy, and bigram-model surprise (bits/char)
- **Δ predictability**: how much predictability the quantum stream dissolved
- A deterministic Library of Babel hex address with a deep link to that page

See [`docs/METHOD.md`](docs/METHOD.md) for the math.

## Architecture

```
src/
├── lib/                  # pure-function core (testable, no DOM)
│   ├── bits.js           # bit/byte/string conversions
│   ├── qrng.js           # ANU QRNG fetch + crypto fallback
│   ├── entropy.js        # Shannon info / H / cross-entropy
│   ├── bigram-model.js   # tiny English predictor for divergence meters
│   ├── babel-alphabet.js # 29-symbol Babel alphabet helpers
│   ├── babel-address.js  # bits -> room/wall/shelf/volume/page URL
│   └── pipeline.js       # the full fusion pipeline
├── ui/
│   ├── main.js           # DOM glue
│   └── styles.css
index.html
docs/METHOD.md            # information-theory derivation
tests/                    # node:test unit tests for core libs
```

## Tests

```bash
npm test
```

Tests cover entropy primitives, XOR, and Babel address derivation. The QRNG
path isn't unit-tested (live API).

## Security note

- **Never commit a real API key.** `.env.local` is gitignored.
- The user-facing key input writes to `localStorage` only, never to a backend
  (there is no backend).
- If you posted a key publicly to get help with this app, rotate it.

## Credits

- 3Blue1Brown's compression/entropy trilogy for the mathematical framing
- ANU QRNG for the live quantum bytes
- Jonathan Basile's Library of Babel for the projection target
- victor-cortez's [Library-of-Babel-Python-API](https://github.com/victor-cortez/Library-of-Babel-Python-API) as reference for the address scheme
