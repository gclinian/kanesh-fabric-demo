# Design System — Kanesh Fabric DPP

> Source of truth for the visual system. Read this before any UI change.
> Tokens live in `assets/css/tokens.css`; layout in `base.css`; components in `components.css`.

## Product Context
- **What this is:** Interactive prototype of a textile supply-chain Digital Product Passport (DPP). One cloud platform (Kanesh, the DPP issuer) + factory endpoints (spinning / weaving / dyeing) that talk via same-origin `localStorage`. Real IPFS + Sepolia NFT minting for on-chain provenance.
- **Who it's for:** B2B — textile brands, factories, regulators. Shown to stakeholders, so it must read as credible enterprise/industrial software.
- **Space:** DPP / supply-chain traceability / blockchain provenance (peers: Circularise, TextileGenesis, Sourcemap, Retraced).
- **Project type:** Zero-build static web app (data-dense B2B tool), no framework.

## Aesthetic Direction
- **Direction:** Industrial-Archival — a credible *instrument of record*. Technical documentation + precision instrument + certificate/ledger.
- **Memorable thing:** "Infrastructure you'd trust with provenance," not a marketing site.
- **Decoration level:** minimal — hairline rules and typography do the work. No illustration, no gradients, no blobs.
- **Why it wins:** The category converges on white + Inter/Plus-Jakarta + one pastel accent (purple=crypto, green=sustainability) + isometric art — all interchangeable and template-like. We deliberately break that: warm paper, ink, one deep technical accent, monospace data, and ruled engineered panels.
- **Anti-patterns (never):** emoji as UI, purple/violet gradients, 3-column icon-in-circle grids, centered-everything, bubbly uniform radius, isometric illustrations, Inter/system-ui as display or body font.

## Typography
Distinctive trio (nobody in the category pairs serif + grotesque + mono):
- **Display / page titles / passport header:** **Fraunces** (opsz serif) — archival authority. Weights 400/500/600. Used for `h1`, passport header, big numbers. Use sparingly.
- **UI / body / labels / nav:** **General Sans** — precise grotesque, not Inter. Weights 400/500/600/700. Default `body` font.
- **Data / tables / hashes / tokens / field values:** **JetBrains Mono** — the "technical instrument" signal. Weights 400/500. Everything machine-generated (token ids, keccak hashes, kv, field values, timestamps) is mono.
- **Loading:** self-hosted `@font-face` in `assets/css/fonts.css` (woff2 under `assets/fonts/`) — keeps the app fully offline / no external CDN. System stacks as fallback.
- **Scale (px):** eyebrow/kicker 11 (mono, .14em tracking, uppercase) · body 14 · h3 15.5 · h2 18 · h1/page-title 24–26 (serif) · display 34–40 (serif).

## Color
- **Approach:** restrained — warm neutrals carry the UI; one deep accent; desaturated per-stage colors.
- **Paper (bg):** `#F4F1E9` · **paper2 (raised nav/headers):** `#FBF9F3` · **surface:** `#FFFFFF`
- **Ink (text):** `#1B1A16` · **soft:** `#55534A` · **muted:** `#8A887C`
- **Hairline:** `#E3DFD3` · **hairline-strong:** `#D2CBBA`
- **Primary — Petrol:** `#0E4F4A` (hover `#0A3B37`, tint bg `#E7EEEC`). The platform accent, primary buttons, active/link. Deliberately not the category's emerald/purple.
- **Per-stage role colors (desaturated):** Spinning = Petrol `#0E4F4A` · Weaving = Aubergine `#6B3F6E` · Dyeing = Slate `#37477A`.
- **Signal — Amber:** `#9A6A2F` (rare highlights only).
- **Semantic (muted):** success `#3F6B47` / bg `#E9EFE7`; warning `#9A6A2F` / bg `#F4ECDD`; error `#8A3B2E`; info uses petrol tint.
- **Encrypted / regulator field accent:** Aubergine `#6B3F6E`.
- **Dark used intentionally:** passport header and active nav item use Ink `#1B1A16` on paper — high-contrast "official" moments.

## Spacing
- **Base unit:** 8px. **Density:** comfortable-dense (a data tool, not a landing page).
- **Scale:** 2xs 2 · xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48.

## Layout
- **Approach:** grid-disciplined. Left sidebar nav + main content. Max content width ~1040px.
- **Panels, not cards:** group related content in **hairline-ruled panels** (1px `--line` border, shared internal dividers) instead of individually floating rounded cards. This is the core "engineered" move.
- **Border radius:** small and consistent — `--radius: 6px` (panels/buttons), `999px` only for pills/chips. No large 12–16px bubble radius.
- **Shadow:** flat and subtle — `0 1px 0 rgba(27,26,22,.03), 0 1px 3px rgba(27,26,22,.05)`. Panels lean on borders, not elevation.
- **Rules:** thin `1px solid var(--line)` dividers everywhere; dotted `--line-strong` for attribute rows in the passport.

## Motion
- **Approach:** minimal-functional. Only transitions that aid comprehension (progress bars, chain animation). Easing `ease-out` in / `ease-in` out; durations 150–250ms. No decorative motion.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-01 | Initial design system: Industrial-Archival | Created by /design-consultation after research: the DPP/traceability category is visually interchangeable (white + Inter + pastel). Chose warm-paper + ink + petrol + serif/grotesque/mono + ruled panels to read as a credible instrument of record. |
