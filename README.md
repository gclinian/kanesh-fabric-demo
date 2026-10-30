# Kanesh Fabric DPP Demo

Interactive prototype of a textile supply-chain **Digital Product Passport (DPP)**. It combines a cloud platform with factory endpoints (three stages on one page) to demonstrate the complete workflow: **the platform dispatches policies → each factory decides which data to publish or encrypt and uploads it → NFTs are minted on-chain in sequence → the platform aggregates the public data into a DPP + QR code**.

The four role pages communicate through same-origin `localStorage` (using the `dpp_demo:` key prefix), simulating different roles collaborating across browser tabs.

| Page | Role |
|---|---|
| `platform.html` | ☁ Kanesh cloud platform / DPP issuer (dispatches policies, collects data, mints NFTs, provides blockchain browsing, and generates the DPP + QR code) |
| `factory.html?stage=spin` | 🧵 Spinning mill (stage 1) |
| `factory.html?stage=weave` | 🧶 Weaving mill (stage 2) |
| `factory.html?stage=dye` | 🏭 Dyeing and finishing mill (stage 3) |

---

## Requirements

- **Node.js** ≥ 18 (runs the IPFS upload backend)
- **Python 3** (provides the local HTTP server for static pages)
- Real minting additionally requires a **Pinata** account JWT (for IPFS uploads), **MetaMask** configured for the **Sepolia** testnet, and test ETH

> You can run the complete demo without using a wallet — select **🧪 Simulate On-Chain** throughout instead (see below).

---

## Quick Start

```bash
# 1) Install backend dependencies (from the repository root)
npm install

# 2) Configure the Pinata key (only required for real minting)
cp .env.example .env
#   Edit .env and set PINATA_JWT=... (PINATA_GATEWAY=... is optional)

# 3) Start the IPFS upload backend → http://localhost:3001
npm start

# 4) In another terminal, start the frontend static server → http://localhost:8000
npm run serve
```

Open **http://localhost:8000/platform.html** in a browser to begin.

> Why use an HTTP server instead of opening the files directly? Wallet integrations and cross-origin `fetch` require an `http://localhost` origin, and browsers block external CSS/JS under `file://`. Always use `npm run serve`.

---

## Demo Workflow

Open all four pages in the **same browser** (they communicate through same-origin `localStorage`):

1. In the **platform** (`platform.html`), open the **Policy Builder**, configure the fields to collect at the **spinning** stage, and **Dispatch Policy** (this unlocks only the spinning stage).
2. Open **`factory.html?stage=spin`**. The red dot appears on **📥 Policy Inbox** in the sidebar. For each field, choose 🌐 Public or 🔒 Encrypted, then select **Encrypt & Submit**.
3. Return to the platform's **Collection Progress**. Two buttons are available:
   - **🪙 Mint NFT (Real On-Chain)**: upload metadata to IPFS, have the platform wallet call the Sepolia contract's `mintDPP`, and receive a real `tokenId`. Each stage links to the previous one with `previousTokenId` for on-chain provenance.
   - **🧪 Simulate On-Chain (Offline)**: a fallback for running without a backend or wallet, using simulated blocks to complete the same workflow.
   - The next stage is **unlocked only after minting is complete**.
4. Repeat with **`?stage=weave`** (weaving) and **`?stage=dye`** (dyeing and finishing).
5. After all three stages are complete, the platform issues the **DPP + QR code**. Switch between the **Consumer** view (public fields only) and the **Regulator** view (fields can be decrypted for review).

Contract: `SimpleDPPNFT` at `0x24aeeb254a48820b5b0bdcbdce980a725535718f` (Sepolia).

---

## Project Structure

```
platform.html            Cloud platform (inline JS; CSS uses shared styles)
factory.html             Three factory stages on one page, ?stage=spin|weave|dye
assets/css/              tokens.css (colors/sizing) · base.css (layout) · components.css (components)
assets/js/factory-app.js Shared application logic for all three factories
stages/{spin,weave,dye}.js  Per-stage configuration (fields + stage color)
server/                  IPFS upload backend (server.js + tests/)
contracts/               Sepolia NFT contract, SimpleDPPNFT.sol
docs/                    Project context (CONTEXT.md), implementation plans, and legacy documentation
```

### Updating the Frontend
- **Design system**: See [`DESIGN.md`](DESIGN.md) for the visual direction and guidelines (Industrial-Archival: warm paper + ink + petrol, Fraunces / General Sans / JetBrains Mono, and ruled panels). Read it before making visual changes.
- Colors, border radius, and sidebar width → `assets/css/tokens.css` (shared by the platform and factories); fonts are self-hosted under `assets/fonts/` via `assets/css/fonts.css` to keep the app offline.
- Layout → `assets/css/base.css`; component styling → `assets/css/components.css`
- Shared factory logic → `assets/js/factory-app.js`
- Per-stage fields and colors → `stages/<id>.js`
- Chinese/English switching → the **🌐 中/EN** button in the top bar (`assets/js/i18n.js`). The language is stored in `dpp_demo:lang`, shared by the platform and factories, and synchronized across tabs. Wrap new strings with `${t('中文','English')}` to make them bilingual; put English field labels in `labelEn` in `stages/*.js`.

`npm run serve` is a **no-cache development server** (`scripts/dev-server.py`). After saving changes, a normal browser refresh is enough; a hard refresh is not required.

> `assets/js/factory-app.js` is a classic top-level script. Keep all functions global because the UI calls them through inline `onclick` handlers; do not wrap it in an IIFE or convert it to an ES module.

---

## Tests

```bash
npm test     # Backend + DPP metadata helpers, node --test, 34 tests
```

For deeper design context and cross-session handoff notes, see [`docs/CONTEXT.md`](docs/CONTEXT.md).
