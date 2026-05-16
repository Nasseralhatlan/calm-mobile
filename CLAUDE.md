# Calm — Mobile

Expo / React Native app for **Calm**, a Saudi Arabia event-venue booking
marketplace. We focus on event-driven rentals — chalets (شاليهات), rest
houses (استراحات), camps (مخيمات), farms (مزارع) — for birthdays,
gatherings, and parties, with optional add-on services (catering,
decoration, waitstaff).

Both **guests** (browse + book) and **hosts** (list + manage) use this app.

## Stack

- Expo 54, Expo Router 6 (file-based routing in `app/`)
- React 19, React Native 0.81, TypeScript
- Reanimated 4 + Gesture Handler 2 already installed

## Brand

- **Coral:** `#F88379` — the only confirmed brand color so far.
- **Logos:** in `assets/logo/` — `logo.png` (coral), `logo-black.png`,
  `logo-white.png`. Pick by background.
- **Font: Satoshi** — shared with web. Copy from
  `../calm-web/public/fonts/Satoshi-*.ttf` into `assets/fonts/`, then
  load via `expo-font`. Weights to wire up: Light, Regular, Medium,
  Bold, Black.
- **Aesthetic: Airbnb mobile clone, minus Experiences and Services tabs.**
  Generous whitespace, large imagery, restrained typography. Smooth,
  **bouncy** interactions — spring physics via Reanimated, never linear
  ease-out for primary affordances.

## i18n — bilingual AR + EN

- Arabic is the default locale; English is a peer, not a fallback.
- Enable RTL: `I18nManager.allowRTL(true)` + `forceRTL` based on locale.
- **Never use** `marginLeft`/`marginRight`/`paddingLeft`/`paddingRight`.
  Use `marginStart`/`marginEnd`/`paddingStart`/`paddingEnd`.
- No inline user-facing strings — everything routes through the i18n layer.
- Test every screen in **both** directions before claiming a feature done.

## API

- Talks to Laravel backend (`calm-backend`) over REST JSON.
- Auth: token-based (Sanctum likely — confirm). Keep token handling in
  one module; never read tokens directly from screens.
- Base URL via env (`EXPO_PUBLIC_API_URL`).

## Conventions

- One screen per route file under `app/`; **shared UI in `components/`** —
  if it appears twice, extract it. Components should be presentational and
  accept props; never reach into global state directly.
- **Minimize third-party deps.** What ships with Expo is enough — don't add
  new libraries without asking. **No icon library** — Nasser provides icons
  as SVG / PNG assets per screen.
- Money: display in SAR with locale-aware formatting (`Intl.NumberFormat`).
- Dates: display in `Asia/Riyadh`; the wire format stays ISO 8601 UTC.
- Don't block the UI on network for >300ms without a skeleton / spinner.
- Haptics via `expo-haptics` on confirm/destructive actions only.

## Scope (v1)

- **Guest only.** Hosts are out of scope for the mobile v1 — they'll manage
  via web later. See [[build-order-calm]].
- **Auth is mocked locally** — a `currentUser` fixture, no phone OTP yet.
  Build every screen as if logged in; we'll retrofit gates later.
- Data is mocked locally too — typed fixtures in `data/`. The backend
  (`calm-backend`) does not exist yet by design; we'll reverse-engineer it
  from the shapes the UI ends up needing.
