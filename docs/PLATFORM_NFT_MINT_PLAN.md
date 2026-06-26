# Plan: Adapt DPP_NFT real upload→mint into the platform (per-factory Mint button)

## Context

The platform (`platform.html`) currently **auto-creates a *simulated* block** (`mintBlock()` using `simpleHash`) inside its `Bus.onChange` handler the moment a factory uploads. There is no real on-chain token.

The sibling project `DPP_NFT/` already implements a **real** Digital Product Passport NFT pipeline (IPFS via a Pinata-proxy backend + MetaMask + a deployed Sepolia ERC-721). Goal: the platform should adopt that method so that **when a factory uploads its data, the platform surfaces a *button* to mint a real NFT for that stage** (instead of silently auto-minting a fake block), with an offline simulated fallback.

### Confirmed decisions
1. **Mint path:** Real DPP_NFT pipeline, **plus** a secondary "🧪 模擬上鏈(離線)" fallback button.
2. **Sequence gate:** A stage counts as *done* (and the next factory's policy unlocks) only **after its NFT is minted** — so each stage's `previousTokenId` can point to the prior stage's real `tokenId` (on-chain provenance chain).
3. **Config:** Reuse DPP_NFT's existing deployed Sepolia contract `0x24aeeb254a48820b5b0bdcbdce980a725535718f` and its `server.js` backend on `localhost:3001`.
4. **Token owner:** The platform operator's single connected wallet receives/owns all three stage tokens (platform custody).

## Method being adapted (verbatim source references)

- **Backend (run as-is):** `DPP_NFT/server.js` — `POST /upload-metadata` (body = metadata JSON) → proxies to Pinata → returns `{cid, tokenURI:"ipfs://<cid>", gatewayURL}`. Also `GET /fetch-metadata?tokenURI=...`. Port 3001, `cors()` open, needs `PINATA_JWT` in `.env`.
- **Contract (already deployed):** `DPP_NFT/contracts/SimpleDPPNFT.sol` — `mintDPP(address to, string tokenURI_, bytes32 metadataHash, bytes32 schemaHash, bytes32 orderHash, bytes32 stage, uint256 previousTokenId) returns (uint256)`, emits `DPPMinted(tokenId, recipient, tokenURI, metadataHash, schemaHash, orderHash, stage, previousTokenId)`. Unrestricted minter.
- **Front-end pipeline to port:** `DPP_NFT/factory-endpoint.html` lines 174–192 (ethers UMD script + config/ABI), `stableStringify` (380), `buildMetadataJson` (387), `computeDPPHashes` (415), `uploadMetadataToIPFS` (425), `connectWallet`/`switchToSepolia` (323/339), and the mint sequence in `doSign` (1041–1146: build → hash → upload → `new ethers.BrowserProvider` → `getSigner` → `new ethers.Contract` → `contract.mintDPP(...)` → `tx.wait()` → parse `DPPMinted` for `tokenId`).

## Changes — all in `platform.html`

### 1. Load ethers + EVM config
- Add `<script src="https://cdn.jsdelivr.net/npm/ethers@6.17.0/dist/ethers.umd.min.js"></script>` after the existing inlined QR `<script>` (line ~155), before the main app `<script>`.
- Near the top of the main script add constants: `CONTRACT_ADDRESS`, `CONTRACT_ABI` (the two strings above), `SEPOLIA_CHAIN_ID=11155111`, `SEPOLIA_CHAIN_HEX='0xaa36a7'`, `IPFS_UPLOAD_ENDPOINT='http://localhost:3001/upload-metadata'`, and `let REAL_MINT=true`.
- Extend each entry in the existing `STAGES` array with `schema` (e.g. `'dpp-spin-v1'`) and `factoryDid` (e.g. `'did:web:spin-factory.example'`). `order` string = `ORDER.no`; `stage` string = `stage.id`.

### 2. Port metadata + hashing + upload + wallet helpers
Add (adapted from DPP_NFT, reusing names where possible):
- `stableStringify(value)` — verbatim.
- `buildStageMetadata(stage, sub)` — from the submission's `fields`: `publicData` = public fields `{key:val}`; `encryptedData` = private fields `{key:'ENC(DEMO_ONLY:key)'}`; `attributes` = `{trait_type:label, value: public?val:'Encrypted (demo placeholder)', visibility}`; plus `dpp:{schema, order:ORDER.no, stage:stage.id, previousTokenId, factoryDid, publicData, encryptedData, encryptionNotice:'DEMO_ONLY_NOT_REAL_ENCRYPTION'}` and `name`/`description`.
- `computeDPPHashes(metadata, stage)` — keccak256 of canonical JSON / `stage.schema` / `ORDER.no` / `stage.id` via `ethers.keccak256(ethers.toUtf8Bytes(...))`.
- `uploadMetadataToIPFS(metadata)` — `fetch(IPFS_UPLOAD_ENDPOINT, POST json)` → `{cid, tokenURI, gatewayURL}` (verbatim error handling).
- Minimal `walletState`, `connectWallet()`, `switchToSepolia()`, `isSepolia()`, `walletErrorMessage()` (trimmed from DPP_NFT). Optional small wallet-status chip in the topbar.

### 3. Real mint entry point: `mintStageToken(stageId)`
Mirror `doSign` but driven by a stored submission and chained provenance:
- Guard `ethers`/`window.ethereum`; `connectWallet()`; ensure Sepolia.
- `sub=getSub(stageId)`; `previousTokenId` = previous **minted** stage's real `block.tokenId` (or `0` for `spin`).
- `metadata=buildStageMetadata(stage, sub)`; `hashes=computeDPPHashes(...)`; `upload=await uploadMetadataToIPFS(metadata)`.
- `signer` → `recipient=await signer.getAddress()`; `contract.mintDPP(recipient, upload.tokenURI, metadataHash, schemaHash, orderHash, stageHash, BigInt(previousTokenId))`; `await tx.wait()`; parse `DPPMinted` → `tokenId`.
- Write back a **real block**: `Bus.set('submission:'+stageId, {...sub, block:{ index:stage.order, stage:stageId, label, factoryId, tokenId, txHash:tx.hash, tokenURI:upload.tokenURI, cid:upload.cid, gatewayURL:upload.gatewayURL, metadataHash:hashes.metadataHash, prevTokenId:previousTokenId, timestamp:nowUTC(), issuer:recipient, real:true }, metadata, canonicalJson:hashes.canonicalJson})`. This write triggers the factories' existing `onChange` (they already render `block.tokenId` / show "已上鏈").
- Drive a live progress modal via `state.mintProgress={stage,step,message,error}` (steps: 連接錢包→建立 metadata/雜湊→上傳 IPFS→送出 mintDPP→等待確認), and a final toast with an Etherscan link.

### 4. Offline fallback: `simulateMintStage(stageId)`
Reuse the existing **simulated** `mintBlock(sub)` to write back a `block` (mark `real:false`). Exposed as a secondary "🧪 模擬上鏈(離線)" button next to the real one.

### 5. Stop auto-minting; show buttons instead
- In `Bus.onChange` (submission with `block:null`): **remove the auto-`mintBlock` call**. Instead log/toast "📥 X廠已上傳 · 待平台鑄造 NFT", bump `state.unseen`, `render()` so the Mint buttons appear.
- Remove the auto-mint behavior of `mintPending()` (called at startup and in `refreshAll`) — pending stages should now display buttons, not silently mint. Keep startup `render()`.

### 6. Guard every `sub.block` consumer (block may be null while pending)
Introduce helpers `minted()` = `subs().filter(s=>s.block)` and `pendingStages()`. Update:
- **`vCollect`** (line 365): per stage → minted: show `Token #` (+ Etherscan/IPFS links if `real`); uploaded-but-pending: show "已上傳 · 待鑄造" + **[🪙 Mint NFT]** + **[🧪 模擬上鏈]**; dispatched-only: "等待工廠上傳"; else "等待政策派發".
- **`vPolicy` sequence gate**: base `received` on `minted().length` (next stage unlocks only after mint). When the active stage is uploaded-but-not-minted, show "已上傳,待鑄造 NFT" with the Mint button.
- **`vChainExplorer`** (384): iterate `minted()`; for `real` blocks render `tokenId`, `prevTokenId`, `txHash` as `https://sepolia.etherscan.io/tx/<hash>` link, and `tokenURI`/`gatewayURL` as IPFS links; keep the `simpleHash` linked-hash "驗證鏈接" path only for simulated blocks.
- **`vDPP` / `dppPreview` / `dppHashOf` / `showDppJson`**: gate on and iterate `minted()` (≥3 to issue).
- **home dashboard** counts: use `minted()` / pending counts.

### 7. Optional (nice-to-have) — factory display polish
`factory-spin/weave/dye.html` already render whatever block fields the platform writes, so no change is required for correctness. Optionally, in their shared `vChain`, render `txHash` as an Etherscan link and show `tokenURI`/`cid`. Because the three factory bodies are byte-identical after the `===STAGE-CONFIG-END===` marker, edit `factory-spin.html` then re-propagate the post-marker body to weave/dye (same `awk` copy technique used previously). Mark OPTIONAL.

## Files
- **Modify:** `platform.html` (all core changes).
- **Optional modify:** `factory-spin.html` (+ propagate to `factory-weave.html`, `factory-dye.html`).
- **Reuse unchanged:** `DPP_NFT/server.js`, `DPP_NFT/contracts/SimpleDPPNFT.sol`, `DPP_NFT/.env.example`.

## Runtime requirements (document in README / a callout)
1. Backend: `cd DPP_NFT && npm install && cp .env.example .env` → set `PINATA_JWT` → `npm start` (listens on `:3001`).
2. Serve the fabric folder over HTTP so the origin is `http://localhost` (needed for wallet + cross-origin fetch to `:3001`): `cd fabric && python3 -m http.server 8000`, open `http://localhost:8000/platform.html`.
3. MetaMask (or injected EVM wallet) on **Sepolia** with test ETH; ethers loads from jsDelivr (internet required for real mint; offline → use the 模擬上鏈 button).

## Verification (end-to-end)
1. Start backend (`/health` returns `{status:"ok", pinataConfigured:true}`), serve fabric over HTTP, open `platform.html`.
2. 政策建構器 → dispatch **紡紗**; open `factory-spin.html`, complete 揭露決策 → 送出. Platform 收集進度 shows **"待鑄造"** + Mint button (no auto-mint).
3. Click **🪙 Mint NFT** → wallet prompts on Sepolia → confirm. Verify: toast + Etherscan link; 收集進度 shows real **Token #<id>**; 區塊鏈瀏覽器 shows the token with a working Etherscan tx link and `ipfs://` tokenURI; **weave** policy now unlocks.
4. Repeat for **織布** then **染整**; confirm each token's `previousTokenId` equals the prior stage's real `tokenId` (check on Etherscan `dppRecords(tokenId)` or the explorer view).
5. After 3 mints → **DPP 與 QR** issues; consumer view shows public fields, 法規機關 shows decrypted; QR encodes the passport URL.
6. Offline check: with backend/wallet down, click **🧪 模擬上鏈** → simulated block completes the same flow so the demo still runs.
7. Regression: red-light/sequential behavior, 消費者/法規 audience, and factory "等待平台上鏈 → 已上鏈" transition still work.
