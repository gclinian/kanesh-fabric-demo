# Kanesh Fabric DPP Demo

紡織供應鏈「**數位產品護照(DPP)**」互動原型。一個雲端平台 + 工廠端點(三站合一頁),
完整演示工作流:**平台派政策 → 各廠決定公開/加密並上傳 → 依序鑄造 NFT 上鏈 → 平台用明文彙整成 DPP + QR**。

四個角色頁面以同源 `localStorage`(鍵前綴 `dpp_demo:`)當訊息匯流排互通,模擬「不同角色在不同分頁協作」。

| 頁面 | 角色 |
|---|---|
| `platform.html` | ☁ Kanesh 雲端平台 / DPP 發行方(派政策、收集、鑄造 NFT、區塊鏈瀏覽、DPP + QR) |
| `factory.html?stage=spin` | 🧵 紡紗廠(第 1 站) |
| `factory.html?stage=weave` | 🧶 織布廠(第 2 站) |
| `factory.html?stage=dye` | 🏭 染整廠(第 3 站) |

---

## 需求

- **Node.js** ≥ 18(跑 IPFS 上傳後端)
- **Python 3**(提供靜態頁面的本機 HTTP server)
- 真實鑄造額外需要:**Pinata** 帳號的 JWT(IPFS 上傳)、瀏覽器 **MetaMask** 切到 **Sepolia** 測試網並持有測試 ETH

> 不想碰錢包也能完整跑 demo —— 全程改按 **🧪 模擬上鏈** 即可(見下方)。

---

## 快速開始

```bash
# 1) 安裝後端依賴(根目錄)
npm install

# 2)(真實鑄造才需要)設定 Pinata 金鑰
cp .env.example .env
#   編輯 .env,填入 PINATA_JWT=...(可選 PINATA_GATEWAY=...)

# 3) 啟動 IPFS 上傳後端 → http://localhost:3001
npm start

# 4) 另開一個終端,啟動前端靜態 server → http://localhost:8000
npm run serve
```

瀏覽器打開 **http://localhost:8000/platform.html** 即可開始。

> 為什麼要用 HTTP server 而不是直接雙擊開檔?錢包與跨來源 `fetch` 需要 `http://localhost` 來源,
> 且外部 CSS/JS 在 `file://` 下會被瀏覽器擋住。請務必用 `npm run serve`。

---

## Demo 流程

四個分頁請開在**同一個瀏覽器**(靠同源 `localStorage` 互通):

1. **平台** `platform.html` → **政策建構器** → 設定**紡紗**站要收集的欄位 → **派發政策**(只解鎖紡紗站)。
2. 開 **`factory.html?stage=spin`** → 側欄「📥 政策收件匣」紅點亮起 → 逐欄選 🌐 公開 / 🔒 加密 → **加密與送出**。
3. 回平台「**收集進度**」→ 出現兩顆按鈕:
   - **🪙 Mint NFT(真實上鏈)**:metadata 上傳 IPFS → 平台錢包呼叫 Sepolia 合約 `mintDPP` → 取得真實 `tokenId`;每站以 `previousTokenId` 串接前一站(on-chain 溯源)。
   - **🧪 模擬上鏈(離線)**:無後端/錢包時的備援,用模擬區塊完成同一流程。
   - 鑄造完成後才**解鎖下一站**。
4. 重複 **`?stage=weave`**(織布)、**`?stage=dye`**(染整)。
5. 三站完成 → 平台發行 **DPP + QR**,可切換 **消費者**(只見公開欄位)/ **法規機關**(可解密審閱)兩種視角。

合約:`SimpleDPPNFT` @ `0x24aeeb254a48820b5b0bdcbdce980a725535718f`(Sepolia)。

---

## 專案結構

```
platform.html            雲端平台(自帶 JS;CSS 走共用樣式)
factory.html             工廠端三站合一,?stage=spin|weave|dye
assets/css/              tokens.css(顏色/尺寸)· base.css(佈局)· components.css(元件)
assets/js/factory-app.js 三廠共用應用邏輯
stages/{spin,weave,dye}.js  各站設定(欄位 + 站別色)
server/                  IPFS 上傳後端(server.js + tests/)
contracts/               Sepolia NFT 合約 SimpleDPPNFT.sol
docs/                    交接脈絡 CONTEXT.md、實作計畫、舊版說明
```

### 改前端介面
- 顏色 / 圓角 / 側欄寬 → `assets/css/tokens.css`(平台與工廠共用;工廠靛色主題在 `body.factory`)
- 佈局 → `assets/css/base.css`;元件外觀 → `assets/css/components.css`
- 三廠共用邏輯 → `assets/js/factory-app.js`
- 各站欄位 / 站別色 → `stages/<id>.js`
- 中英切換 → topbar 的 **🌐 中/EN** 鈕(`assets/js/i18n.js`)。語言存 `dpp_demo:lang`、平台與工廠共用並跨分頁同步。新字串用 `${t('中文','English')}` 包起來即可雙語;欄位英文放 `stages/*.js` 的 `labelEn`。

`npm run serve` 是**不快取的 dev server**(`scripts/dev-server.py`),改完存檔後**一般重新整理**就會看到最新版,不必硬重新整理。

> `assets/js/factory-app.js` 是 classic top-level script,所有函式須維持全域(畫面用內聯 `onclick` 呼叫),請勿包進 IIFE 或改成 ES module。

---

## 測試

```bash
npm test     # 後端 + DPP metadata helpers,node --test,34 項
```

更深入的設計脈絡與跨 session 交接說明見 [`docs/CONTEXT.md`](docs/CONTEXT.md)。
