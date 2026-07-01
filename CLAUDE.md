# Kanesh Fabric DPP — project notes

## Design System
Always read **DESIGN.md** before making any visual or UI decision.
Direction is **Industrial-Archival**: warm paper + ink + one deep petrol accent,
serif display (Fraunces) / grotesque UI (General Sans) / monospace data (JetBrains Mono),
hairline-ruled panels (not floating cards). No emoji, no gradients, no pastel-SaaS look.
All colors, fonts, spacing, radius live in `assets/css/tokens.css` (+ `fonts.css`).
Do not deviate without explicit user approval.

## Frontend structure
- Static, zero-build. Shared CSS: `assets/css/{fonts,tokens,base,components}.css`.
- Shared JS: `assets/js/{i18n,factory-app}.js`; per-stage config `stages/{spin,weave,dye}.js`.
- `factory.html?stage=spin|weave|dye` (three factories, one page); `platform.html` (cloud platform).
- i18n: wrap strings as `${t('中文','English')}`; 🌐 toggle in topbar; lang in `dpp_demo:lang`.
- Fonts self-hosted under `assets/fonts/` — keep the app fully offline (no CDN).
- Run: `npm start` (backend :3001) + `npm run serve` (no-cache static :8000).
