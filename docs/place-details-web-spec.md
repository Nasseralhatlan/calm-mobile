# Place Details — Web Rebuild Design Spec

A pixel-faithful specification of the mobile **place-details page and its sub-pages**, for rebuilding
them on the web. Values are taken directly from the React Native source (`constants/theme.ts`,
`app/listing/[id]/*`, `app/photo-viewer.tsx`, `components/*`).

> **Scope boundary.** Everything up to **and including the Reserve button** is in scope. Everything
> that happens **after** pressing Reserve — the reserve sheet and the booking flow
> (dates → services → summary → pay → confirmation) — is **out of scope**. The spec only notes
> *where* Reserve navigates.

**Surfaces covered**

| # | Screen | Source | Presentation |
|---|--------|--------|--------------|
| 1 | Place details (main) | `app/listing/[id]/index.tsx` | Pushed, `slide_from_right`, no header |
| 2 | All features | `app/listing/[id]/amenities.tsx` | Modal |
| 3 | Full description | `app/listing/[id]/description.tsx` | Modal |
| 4 | Photo tour (gallery) | `app/listing/[id]/photos.tsx` | Pushed, `slide_from_right` |
| 5 | All reviews | `app/listing/[id]/reviews.tsx` | Modal |
| 6 | Full-screen photo viewer | `app/photo-viewer.tsx` | Pushed, `slide_from_right` |

Note: the app currently ships **English/LTR only** (Arabic temporarily disabled), but the design is
fully bilingual — RTL rules are documented in §5 so the web can support both.

---

## 1. Design system reference

### 1.1 Colors

**Global tokens** (`constants/theme.ts`, light theme — the app always uses light):

| Token | Hex | Usage |
|-------|-----|-------|
| `text` | `#1A1A1A` | Default text (theme), reserve-bar price |
| `textMuted` | `#6B7280` | Secondary text, "per day" unit |
| `background` | `#FEFEFE` | Screen background |
| `surface` / `surfaceElevated` | `#FFFFFF` | Cards, sections |
| `border` | `#E5E7EB` | Borders |
| `divider` | `#F3F4F6` | Subtle dividers |
| `coral` (brand) | `#F88379` | Reserve CTA, liked heart |
| `coralPressed` | `#E66E64` | Coral pressed |
| `coralDisabled` | `#FAB5AF` | Coral disabled |
| `success` `warning` `danger` `info` | `#16A34A` `#F59E0B` `#DC2626` `#2563EB` | Status |
| `overlay` | `rgba(0,0,0,0.5)` | Scrims |

**⚠️ Page-local overrides** — the place-details screen (`index.tsx`) and sub-pages define their own
constants that differ from the theme. **Match these, not the theme tokens**, for visual parity:

| Local const | Hex | Where |
|-------------|-----|-------|
| `TEXT_PRIMARY` | `#000000` (pure black, not `#1A1A1A`) | titles, body, prices on details + sub-pages |
| `TEXT_SECONDARY` | `#CECECE` (light gray) | subtitles, captions, review dates, counts on the **main details screen** |
| `TEXT_SECONDARY` | `#9CA3AF` | muted text inside the **sub-pages** (amenities/desc/photos/reviews) |
| `DIVIDER_COLOR` | `#F4F4F4` | section separators, card borders |
| review divider | `#D6D6D6` | between rows on the reviews page |
| review card separator | `#ededed` | between review cards on the carousel |
| amenities row divider | `#F0F0F0` | between amenity rows |
| image placeholder | `#F3F4F6` | image loading background everywhere |
| count badge bg | `#111111` | amenity count pill |

### 1.2 Spacing scale (px)

`Spacing[n]`: **1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64, 20=80, 24=96**.
Screen horizontal padding is almost always `Spacing[5]` = **20px**.

### 1.3 Radius scale (px)

`Radius`: **xs=4, sm=8, md=12, lg=16, xl=24, xxl=32, pill=999**.
All native radii use `borderCurve: "continuous"` (iOS squircle). On web, use normal `border-radius`;
optionally approximate the squircle with a superellipse mask, but standard radii are an acceptable
match.

### 1.4 Typography

Two families, selected per locale by `fontFamilyFor(weight, locale)`:

| Weight key | English (Satoshi) | Arabic (thmanyahsans) | CSS weight |
|------------|-------------------|------------------------|------------|
| light | `Satoshi-Light` | `thmanyahsans-Light` | 300 |
| regular | `Satoshi-Regular` | `thmanyahsans-Regular` | 400 |
| medium | `Satoshi-Medium` | `thmanyahsans-Medium` | 500 |
| bold | `Satoshi-Bold` | `thmanyahsans-Bold` | 700 |
| black | `Satoshi-Black` | `thmanyahsans-Black` | 900 |

> Numbers/times (e.g. check-in/out time, prices) always render in the **Satoshi (English)** font even
> in Arabic, for legible Latin digits.

**`ThemedText` variants** (`Type` in theme; used by shared components, though the details screen mostly
uses inline styles):

| Variant | Weight | Size / Line | Letter-spacing |
|---------|--------|-------------|----------------|
| display | bold | 34 / 40 | −0.5 |
| title | bold | 28 / 34 | −0.3 |
| heading | bold | 22 / 28 | — |
| subheading | medium | 18 / 24 | — |
| body | regular | 16 / 22 | — |
| bodyMedium | medium | 16 / 22 | — |
| callout | medium | 15 / 20 | — |
| caption | regular | 13 / 18 | — |
| micro | medium | 11 / 14 | 0.4 |

### 1.5 Motion (springs)

Native uses Reanimated springs; map to web (Framer Motion `type:"spring"` or a tuned easing):

| Preset | damping | stiffness | mass | Feel |
|--------|---------|-----------|------|------|
| default | 14 | 180 | 1 | balanced |
| **bouncy** | 10 | 200 | 1 | snappy, energetic — **all press scales** |
| gentle | 22 | 200 | 1 | soft (modal/expand) |
| snappy | 30 | 400 | 1 | crisp |

**Press feedback:** every interactive element scales down on press via `PressableScale`
(`scaleTo` typically 0.96–0.98; icon buttons 0.88; photo-viewer buttons 0.90), springing back with
`bouncy`. Web equivalent: `transform: scale()` on `:active`/`pointerdown` with a spring transition.

### 1.6 Shadows & blur

Native iOS shadows (Android uses elevation). Web → `box-shadow` `0 {y}px {radius}px rgba(0,0,0,{opacity})`:

| Use | y | radius | opacity |
|-----|---|--------|---------|
| card (theme) | 2 | 8 | 0.06 |
| check-in/out card | 8 | 20 | 0.16 |
| reserve bar | 0 | 25 | 0.05 |
| review/avatar tile | 4 | 8 | 0.14 |
| highlight tile | 15 | 10 | 0.05 |
| modal close button | 4 | 12 | 0.08 |

**Blur surfaces** use `BlurView` → web `backdrop-filter: blur(Npx)` + a tint overlay:

| Element | Native | Web equivalent |
|---------|--------|----------------|
| Floating top buttons | blur 30, light tint + `rgba(255,255,255,0.15)` | `blur(20px)` + white 15% |
| Sticky header / reserve bar | blur 80, light tint + `rgba(255,255,255,0.8)` | `blur(30px)` + white 80% |
| Photo gallery top bar | blur 70, light + white tint | `blur(28px)` + white |
| Photo viewer chrome | blur 40, dark tint + `rgba(0,0,0,0.25)` | `blur(24px)` + black 25% |

---

## 2. Place details — main screen (`index.tsx`)

**Key constants:** `HERO_HEIGHT = screenWidth × 0.95`, `CARD_OVERLAP = 28`, `CARD_RADIUS = 32`,
`SPACE_CARD = 152 × 99`, `DESC_SHOW_MORE_THRESHOLD = 220` chars, `REVIEW_ITEM_W = round(screenWidth × 0.7)`.

**Layout:** a single vertical scroll view; the content card slides **up over the hero by 28px**.
Floating top buttons + a fade-in sticky header overlay the top; a sticky reserve bar pins the bottom.
Content bottom padding = `safeAreaBottom + 110px` (clears the reserve bar). Background `#FEFEFE`.

### 2.1 Hero carousel (`components/hero-carousel.tsx`)
- Full-bleed, **height = screenWidth × 0.95**. Horizontal paging, one image per page.
- **Dots** bottom-center: active `18 × 6` (radius 3, opacity 1), inactive `6 × 6` (opacity 0.55),
  gap 5, all white. Sit `Spacing[4]` above the reserve bar.
- **Photo counter** bottom-trailing (`insetInlineEnd: Spacing[4]`): pill, blur 80 dark +
  `rgba(0,0,0,0.35)`, min-width 48, padding 12×4, white **12px bold** "i / N".
- **Parallax:** scrolling down translates the image down at **35%** of scroll; over-scroll up scales
  the image up (pull-to-zoom).
- Placeholder bg `#F3F4F6`; images `object-fit: cover`, 200ms fade-in.

### 2.2 Floating top buttons (overlay hero)
Row at `safeAreaTop`: **back** (leading) — spacer — **share** + **like** (trailing, gap 8).
Each is a **38px circle**, blur 30 light + `rgba(255,255,255,0.15)`, press scale 0.88.
- Back: chevron-left, 18px, `#1A1A1A`.
- Share: share icon, 18px stroke 2.2, `#1A1A1A`.
- Like (heart): 20px stroke 1.8 — unliked `stroke #1A1A1A / fill none`; liked `stroke+fill #F88379`.

### 2.3 Card head (title block)
Overlaps hero by 28px; top corners radius 32; bg `#FFFFFF`; top padding `Spacing[6]` (24),
horizontal `Spacing[5]` (20).
- **Title:** bold, **19 / 26**, `#000`, centered, 1 line. Gap below 6.
- **Subtitle:** regular, **13 / 18**, `#CECECE`, centered, 1 line. `city · region · {n} guests`
  (non-empty parts joined by " · ").
- **RatingSummary** (size `sm`): row, centered, padding-top `Spacing[5]`, bottom `Spacing[3]`.
  rating number bold 15/19 · five 10px stars (filled `#000`, empty `#E5E5E5`) · count regular 12/16
  `#6B7280`; gaps 4 / star-gap 2.

### 2.4 Description preview — *shown only if `description` present*
Section padding `Spacing[5]`. Title "Description" bold **17 / 24** `#000`, margin-bottom `Spacing[3]`.
Body regular **14 / 24** `#000`, clamped to **5 lines**. If text length > **220**, show a **"Show more"**
pill (margin-top `Spacing[4]`, bg `#F4F4F4`, radius `Radius.lg`=16, padding-v `Spacing[3]`, label medium
14/19) → navigates to **description modal**.

### 2.5 Highlights — *shown only if any attribute has `is_highlighted` (max 3)*
Top & bottom hairline separators `#EAEAEA`. Title "Most important amenities" bold 17/24, centered.
Row of **3 equal columns**, padding-v `Spacing[10]` (40), gap `Spacing[2]`. Each: a **circular white
tile** (padding 4, shadow y15 r10 o0.05) holding a **58×58** circle bg `#f9f9f9` with a **28px emoji**;
below it a centered label (regular 13/18 `#000`, 1 line) and optional description (regular 12/16
`#CECECE`, 2 lines).

### 2.6 Space images — *shown only if photo groups exist*
Title "Space images" bold 17/24, margin-bottom `Spacing[3]`. **Horizontal scroll**, content padding
start 0 / end `Spacing[5]`, gap `Spacing[3]`. Each **card 152 wide**: image **152×99** radius 10,
then optional label (medium 14/19 `#000`, 1 line) + subtitle (regular 13/18 `#CECECE`, 1 line). Tapping a
card → photos gallery filtered to that section. A **"Show all images (N)"** pill (same pill style) →
full photos gallery.

### 2.7 Features & amenities — *shown only if amenities exist*
Title "Features & Spaces" bold 17/24. List of the **first 5** rows, row gap `Spacing[5]`, padding-top
`Spacing[2]`. Each row: icon (AmenityIcon or emoji, 18px in a 28px box; fallback "•") + label
(regular 14/20 `#000`, 1 line). If total > 5, a **"Show all features (N)"** pill → amenities modal.

### 2.8 Check-in / check-out — *shown only if a check time exists*
Title "Check-in & check-out" bold 17/24. A **card** (margin-top `Spacing[2]`, bottom `Spacing[4]`,
radius `Radius.lg`=16, border 0.5 `#F4F4F4`, padding 20v/16h, shadow y8 r20 o0.16): two equal columns
separated by a **36px circle** (`#F4F4F4`, switch icon 16px). Each column, centered, gap 3:
- caption-title (bold 14/19 `#CECECE`) — "Check-in" / "Check-out"
- **time** (bold **20 / 26** `#000`, **Satoshi even in Arabic**, 12-hour like "3:00 PM"; "—" if missing)
- caption (regular 12/17 `#CECECE`) — check-in: "In first day of booking"; check-out:
  `checkoutNextDay` → "Day after last day of booking", else "On last day of booking".

### 2.9 Reviews — *shown only if recent reviews exist*
Header row: big rating number (bold **32 / 38** `#000`) · five 15px stars (filled `#000` for
`i < round(average)`, else `#E5E5E5`) · count (regular 14/19 `#CECECE`). Padding-bottom `Spacing[10]`.
**Horizontal snap carousel** (snap interval `REVIEW_ITEM_W` = 70% width, snap to start, fast decel,
one-at-a-time), shows first **6**, content padding start `Spacing[2]` / end `Spacing[5]`.
Each card (width 70%): a **leading-edge separator** `#ededed` for all but the first (padding-h
`Spacing[10]`). Card content:
- head row: **44×44 avatar tile** (radius 13, white, padding 2.5, shadow y4 r8 o0.14; inner radius 11
  bg `#F3F4F6`; image cover, or uppercase initial bold 18/22) + name (bold 14/19 `#000`, default
  "Guest") and date (regular 12/16 `#CECECE`, "Month Year" English) stacked.
- stars row: five 11px stars (filled `#000` for `i < rate`).
- comment: regular **14 / 26** `#000`, clamp 5 lines; an inline underlined **"Show more"** (medium
  13/18 `#CECECE`) → reviews modal.

A **"Show all reviews (N)"** pill (margin-top `Spacing[10]`) → reviews modal.

### 2.10 Rules — *shown only if `rules` present*
Title "Important rules" bold 17/24; body regular **14 / 24** `#000`, full text (no clamp).

### 2.11 Sticky header (fades in on scroll)
Absolute top, `z-index` above content. Opacity interpolates 0→1 over scroll
`[HERO_HEIGHT−28−100 … HERO_HEIGHT−28−20]` (≈80px window) with a −8→0 slide. Blur 80 light +
`rgba(255,255,255,0.8)`, hairline bottom `#F4F4F4`, height 56, centered title (bold 16/21 `#000`) +
subtitle (regular 12/16 `#CECECE`), both 1 line. Status-bar style flips light→dark at
`scrollY > HERO_HEIGHT − 80`.

### 2.12 Reserve bar (`components/reserve-bar.tsx`) — **scope boundary**
Sticky bottom, full width. Blur 80 light + `rgba(255,255,255,0.8)`, shadow y0 r25 o0.05, padding
top `Spacing[4]`, h `Spacing[5]`, bottom `safeAreaBottom + Spacing[2]`. Row, gap `Spacing[3]`:
- **Price column** (flex 1): price **bold 17/22** `#1A1A1A` via `formatPriceSR(halalas)` →
  `"{nightly/100 with thousands sep} SR"` (e.g. `2,660 SR`); unit regular 12/16 `#6B7280` —
  "per day" / "لليوم".
- **Reserve CTA:** bg **coral `#F88379`**, radius 15, padding ~48h / ~14v, shadow coral y6 r12 o0.3,
  press scale 0.96. Label medium 15/20 white — **"Reserve" / "احجز الآن"**; shows a spinner while
  loading.

**On press (boundary — do not build beyond this):** fetches latest unavailable dates, then routes to
`/booking/[id]/summary` (dates valid) or `/booking/[id]/dates` (need to pick/adjust). Everything past
this navigation is out of scope.

---

## 3. Sub-pages

### 3.1 Shared modal shell (`components/plain-modal-shell.tsx`)
Used by amenities, description, reviews. Background `#FEFEFE`, safe-area top+bottom. Header padding
`Spacing[5]`h, `Spacing[3]` top / `Spacing[4]` bottom. **Circular close button** top-leading: 40×40,
radius 20, bg `rgba(255,255,255,0.9)`, shadow y4 r12 o0.08, icon "xmark" 18px `#1A1A1A`, press 0.88.
**Centered title** bold 17/22 `#000`, with 64px (`Spacing[16]`) side padding so it never collides with
the button. Body flex, padding-h `Spacing[5]`.

### 3.2 All features (`amenities.tsx`) — modal
Title "All features" / "كل المميزات". Body scroll, bottom padding `Spacing[10]`. Amenities are
**grouped**; groups stacked with gap `Spacing[6]`, title→card gap `Spacing[3]`.
- Group title: bold 16/22 `#000`, padding-h `Spacing[1]`.
- Group **card:** white, radius 20, padding 20h/4v, shadow (y0 r50 o0.05), hairline row dividers `#F0F0F0`.
- Row: padding-v `Spacing[3]`, gap 4. Head row (align center, gap `Spacing[3]`): icon (emoji or
  AmenityIcon 18, 28px box) + label (medium 14/20 `#000`, flex 1) + optional **count badge** (min 18×18,
  radius 9, bg `#111111`, white bold 11/14). Optional description below: regular 12/17 `#9CA3AF`,
  padding-h `Spacing[6]`.
- Empty state: centered regular 13/18 `#9CA3AF`, padding-v `Spacing[6]`.

### 3.3 Full description (`description.tsx`) — modal
Title "Description" / "الوصف". Body padding-top `Spacing[3]`, bottom `Spacing[10]`. Single text block:
regular **14 / 24** `#000`, locale-aligned. Loading state: regular 13/18 `#9CA3AF`.

### 3.4 Photo tour gallery (`photos.tsx`) — pushed screen
**Collapsing top bar** (blur 70 light + white, hairline bottom `rgba(0,0,0,0.06)`, z 10):
- **Header row** 52px, padding-h `Spacing[4]`, at safe-area top. Back button 40×40 (chevron-left 20,
  `#1A1A1A`, press 0.88) — centered title "Photo tour" / "جولة بالصور" bold 17/22 — trailing share +
  like (40×40 each, gap 4; share 18 stroke 2.2; heart 20 stroke 1.8, coral when liked). The header row
  **collapses to 0** on scroll-down (>6px), restores on scroll-up, 180ms.
- **Section chip strip** below header (also collapses): horizontal scroll, padding 20h/12v, gap
  `Spacing[3]`. Each chip 76 wide: thumbnail **76×54** radius 12 (`Radius.md`) + label medium 11/16
  `#1A1A1A`, centered, 1 line. Tap → scroll to that section.

**Gallery list** (FlashList): content top = bar height + 8, bottom = safe-area + 24. Rows are
section headers, full-width photos, or 2-up pairs, separated by a **6px** gap (`GALLERY_GAP`):
- Section header: padding 20h, 24 top / 16 bottom. Title bold **26 / 40**, letter-spacing −0.4, `#1A1A1A`,
  1 line; optional detail regular 14/20 `#9CA3AF`.
- Full photo: width 100%, **aspect 3:2**, `object-fit: cover`, press 0.98 (70ms delay).
- Pair row: two flex-1 tiles, gap 6, each **aspect 4:3**, cover, press 0.98.
- Background placeholder `#F3F4F6`. Tapping a photo opens the **full-screen viewer** (§3.6).

### 3.5 All reviews (`reviews.tsx`) — modal
Title `"{average.toFixed(1)} · {count} reviews"` (fallback "Reviews"/"التقييمات"). Body bottom padding
`Spacing[10]`.
- **Summary block** (row, gap `Spacing[5]`, padding 16 top / 20 bottom): left = five **rating bars**
  (5→1), each row height 16, gap `Spacing[3]`: star number medium 13/18 (12px wide) + track (flex,
  height 9, radius 5, bg `#EDEDED`) with black fill (width = count/total %). Right = summary
  (min-width 110, centered, gap `Spacing[2]`): big number bold **44 / 50** `#000`, five 13px stars,
  count regular 13/18 `#9CA3AF`.
- Hairline divider `#D6D6D6` (margin-bottom `Spacing[2]`).
- **Review list:** rows separated by `#D6D6D6` hairlines, each padding-v `Spacing[5]`, gap `Spacing[3]`:
  head (44×44 avatar tile as in §2.9 + name bold 14/19 `#000` + date regular 12/16 `#9CA3AF`),
  five 11px stars (gap 2), comment regular **14 / 26** `#000` (no clamp here — full text).

### 3.6 Full-screen photo viewer (`photo-viewer.tsx`) — pushed, dark
- **Background:** black `#000`, with the current photo blurred behind (blur 100 dark + `rgba(0,0,0,0.3)`)
  plus a `rgba(0,0,0,0.35)` dim; cross-fades on swipe.
- **Pager:** horizontal full-screen paging FlatList; each page is a **pinch-to-zoom** image (max **3.5×**,
  focal-point zoom, pan while zoomed, spring back to fit ~220ms; card radius 28, bg `#0A0A0A`). Paging
  is **locked while zoomed**. Image cross-fade 150ms; backdrop 180ms.
- **Chrome** (all at safe-area top + 8, blur 40 dark + `rgba(0,0,0,0.25)`, hairline border
  `rgba(255,255,255,0.18)`):
  - Info pill, centered, height 42, radius 21, padding-h 16, gap 10, max-width 66%: section name bold
    14 white (truncates) + counter medium 13 `rgba(255,255,255,0.8)` "i / N".
  - Close button leading (`insetInlineStart 14`): 42×42 circle, chevron-left 22 white, press 0.90.
  - Share + like trailing (`insetInlineEnd 14`, gap 10): 42×42 circles; share 18 white; heart 20,
    coral `#F88379` when liked else white.
- Status bar light.

---

## 4. Shared components (visual + props)

| Component | File | Key visual / props |
|-----------|------|--------------------|
| **HeroCarousel** | `components/hero-carousel.tsx` | `photos[]`, parallax via `scrollY`, dots (18/6), counter; height = w×0.95 |
| **ReserveBar** | `components/reserve-bar.tsx` | `halalas`, `onReserve`, `loading`; blurred bar + coral CTA radius 15 |
| **PressableScale** | `components/pressable-scale.tsx` | `scaleTo` (def 0.96), `haptic`; bouncy spring scale on press |
| **RatingSummary** | `components/listing/rating-summary.tsx` | `rating`, `count`, `size` sm/md; number+stars+count |
| **PlainModalShell** | `components/plain-modal-shell.tsx` | `title`, children; circular close + centered title |
| **FloatingCircleButton** | `components/floating-circle-button.tsx` | `size` (def 38), blur 30 light, press 0.88 |
| **StarIcon** | `components/icons/star-icon.tsx` | `size`, `color`; filled `#000` / empty `#E5E5E5` |
| **HeartIcon** | `components/icons/heart-icon.tsx` | `size`,`stroke`,`fill`,`strokeWidth`; coral when liked |
| **ShareIcon** | `components/icons/share-icon.tsx` | `size`,`stroke`,`strokeWidth` (def 2) |
| **SwitchIcon** | `components/icons/switch-icon.tsx` | check-in/out divider, 16px |
| **AmenityIcon** | `components/amenity-icon.tsx` | maps amenity id → emoji/icon, `size` |
| **ThemedText** | `components/themed-text.tsx` | `variant`, `tone`; applies Satoshi/thmanyahsans per locale |

---

## 5. Bilingual / RTL rules

The page is built to mirror cleanly for Arabic. Web mapping:

| Native pattern | Web equivalent |
|----------------|----------------|
| `textAlign: isRTL ? 'right' : 'left'` | `text-align: start` (with `dir="rtl"` on the root) |
| `writingDirection: 'rtl'/'ltr'` | `direction` / `dir` attribute (critical for line-breaking) |
| `flexDirection: 'row'` auto-mirrors under native RTL | flex `row` under `dir="rtl"` mirrors the same way |
| `paddingStart/End`, `marginStart/End` | `padding-inline-start/end`, `margin-inline-start/end` |
| `insetInlineStart/End` (counter, viewer buttons) | `inset-inline-start/end` |
| `borderStartWidth` (review card separators) | `border-inline-start-width` |
| Carousel index from `Math.abs(scrollX)` | scroll offsets reverse under RTL — use abs / `IntersectionObserver` |
| Font swap by locale | Satoshi (en) vs thmanyahsans (ar); numbers/times stay Satoshi |

Set `dir="rtl"` + the Arabic font on the page root for Arabic; everything else follows from logical
properties. Strings are bilingual `{ ar, en }` objects (see §6) — pick by active locale.

---

## 6. Data shape

The screen consumes a `Listing` model (`data/types.ts`, adapted from the API in
`data/place-adapter.ts`) plus the richer `ApiPlaceDetail` (`lib/api.ts`). Bilingual values are
`Localized<T> = { ar: T; en: T }`.

### `Listing` (core, drives most of the page)

| Field | Type | Drives |
|-------|------|--------|
| `id` | string | routing |
| `title` | Localized<string> | title, header |
| `description` | Localized<string> | description section (clamp 220) |
| `rules` | Localized<string>? | rules section |
| `city`, `region` | Localized<string> | subtitle |
| `capacity.guests` | number | subtitle |
| `photos` | string[] | hero carousel |
| `pricing.nightly` | number (**halalas**) | reserve-bar price (÷100 → SAR) |
| `rating.average` | number | rating summary, reviews header |
| `rating.count` | number | counts, "Show all reviews (N)" |
| `checkInTime`, `checkOutTime` | "HH:MM"? | check-in/out card |
| `checkoutNextDay` | boolean? | check-out caption |
| `isLiked` | boolean? | heart state |
| `likesCount` | number? | — |

### `ApiPlaceDetail` (extended; richer sections)

| Field | Shape | Drives |
|-------|-------|--------|
| `attributes[]` | `{ id, attribute:{ id, name_en, name_ar, icon, is_highlighted }, description }` | highlights (`is_highlighted`), amenities list, amenity descriptions |
| `photo_groups[]` | `{ attribute_id, attribute:{ name_en, name_ar, icon }, photos:[{ id, url, sort_order, featured_order }], min_sort_order }` | space-images section, photo-tour sections |
| `reviews_recent[]` | `{ id, rate (1–5), comment, reviewer_name, reviewer_avatar_url, created_at }` (≤10) | reviews carousel + modal |
| `host` | `{ id, name, joined… }` | (host block, if shown) |

### Formatting rules
- **Money:** amounts are in **halalas**; SAR = halalas / 100. The reserve bar uses
  `formatPriceSR` → `Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })` + `" SR"`
  (e.g. `2,660 SR`). Use SAR with locale-aware grouping.
- **Dates/times:** display in `Asia/Riyadh`; check times shown 12-hour ("3:00 PM"); review dates
  "Month Year" (English month names). Wire format stays ISO 8601 UTC.
- **Conditional sections:** description, highlights, space images, amenities, check-in/out, reviews,
  and rules each render **only when their data is present** (see §2).

---

## 7. Build checklist (parity)

- [ ] Hero height = viewport-width × 0.95; content card overlaps it by 28px with 32px top corners.
- [ ] Reserve CTA is coral `#F88379`, radius 15, sticky bottom over a blurred bar; price = `nightly/100` + " SR".
- [ ] Section order: hero → title/rating → description → highlights → space images → amenities →
      check-in/out → reviews → rules; each hidden when empty.
- [ ] "Show more/all" pills navigate to the description / photos / amenities / reviews pages.
- [ ] Sub-pages match: modal shell (amenities/description/reviews) vs pushed gallery + dark viewer.
- [ ] Page-local grays applied (`#000` text, `#CECECE` muted on main screen, `#9CA3AF` on sub-pages).
- [ ] Reserve press is the boundary — nothing past `/booking/[id]/…` is built here.
- [ ] Bilingual: `dir="rtl"` + thmanyahsans for Arabic; logical (inline) CSS properties throughout.
