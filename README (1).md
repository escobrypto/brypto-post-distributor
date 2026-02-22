# Brypto Call Engine v5

Trade call distribution system for crypto analysts. Dual-ingest architecture with premium/basic embed skins.

## Features
- **Dashboard Mode** — Quick call entry with auto R:R calculation
- **DCA Zones** — Weighted average entry with position allocation tracking
- **Defined Risk** — Portfolio % or R-based risk definition
- **Embed Skins** — Premium (full features) & Basic (clean external) previews
- **Webhook Distribution** — Send to multiple Discord servers with per-server skin assignment
- **Trade Lifecycle** — Pending → Active → Partial TP → Break Even → Closed/Stopped/Invalid
- **Update System** — Post trade updates (SL to BE, TP hit, close, etc.)

## Deploy

```bash
npm install
npm run dev
```

## Stack
- React 18 + Vite
- Zero external dependencies (pure React)
- Deployed on Vercel
