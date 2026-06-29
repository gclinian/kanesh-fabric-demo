# DPP 供應鏈展示 · 平台 + 工廠端點(三站合一)

紡織供應鏈「數位產品護照(DPP)」互動原型。一個雲端平台 + 工廠端點(三站合一頁,`?stage=` 切換),
跑通完整工作流:**平台派政策 → 各廠決定公開/加密並上傳 → 依序上鏈 → 平台用明文彙整成 DPP + QR**。

## 檔案

| 檔案 | 角色 | 鏈上位置 |
|---|---|---|
| `platform.html` | ☁ 雲端平台 / DPP 發行方 | 派政策、收集、區塊鏈瀏覽、組 DPP + QR |
| `factory.html?stage=spin\|weave\|dye` | 🧵🧶🏭 工廠端(三站合一) | 紡紗 / 織布 / 染整,依序串接 |
| `assets/css/`、`assets/js/`、`stages/` | 前端共用資產 | 樣式 token / 共用邏輯 / 各站設定 |

這些頁面以同源 `localStorage`(鍵前綴 `dpp_demo:`)當訊息匯流排互通;
QR 產生器(MIT, qrcode-generator)已內嵌進 `platform.html`,**完全離線、無外網相依**。

### 改前端介面
- 顏色 / 尺寸 → `assets/css/tokens.css`(平台+工廠共用;工廠靛色主題在 `body.factory`)
- 佈局 → `assets/css/base.css`;元件外觀 → `assets/css/components.css`
- 三廠共用邏輯 → `assets/js/factory-app.js`(classic script,函式須全域,勿包 IIFE)
- 各站欄位 / 站別色 → `stages/{spin,weave,dye}.js`

## 怎麼跑(建議用本機伺服器,跨檔即時連動最穩)

```bash
cd <本資料夾>
python3 -m http.server 8000
# 瀏覽器開 http://localhost:8000/platform.html
```

> 直接雙擊 `file://` 開啟在 Chromium 系瀏覽器多半也能連動;Firefox 的 `file://` 會隔離 localStorage,
> 此時各檔仍可單獨完整展示(平台內建範例資料),但跨檔即時連動需用上面的本機伺服器。

## Demo 流程(序列派發 · 平台鑄造 NFT)

1. 開 `platform.html`(頂欄為 **Kanesh** 標誌)→ **政策建構器**:採**逐站序列**。先設定 **紡紗** 要收集的特徵 → **派發政策給紡紗廠**;待其回傳並**鑄造 NFT** 後,才解鎖設定 **織布**,再 **染整**(非一次三廠並行)。
2. 對應開 `factory.html?stage=spin` →(解鎖後)`factory.html?stage=weave` → `factory.html?stage=dye`:
   只有「**平台確實派發給本廠**」時側欄 **📥 政策收件匣** 紅點才亮(清空 localStorage 後不再預設恆亮)。工廠端**只能決定每個欄位 🌐公開 / 🔒加密**;誰能解密、上鏈與否由平台控管。
   流程:**揭露決策(公開/加密)** → **預處理** → **加密與送出**。送出的是「簽署 + 加密邊界」,工廠**不自行上鏈**。
3. 回 `platform.html` → **收集進度**:每收到一廠回傳就出現 **「🪙 Mint NFT」** 按鈕。
   - **🪙 Mint NFT(真實上鏈)**:把該站 metadata 上傳 IPFS(透過 `server/server.js` Pinata 代理)→ 以平台錢包呼叫 Sepolia 合約 `mintDPP` → 解析 `DPPMinted` 取得真實 `tokenId`;每站以 `previousTokenId` 串接前一站。整合點見 `platform.html` 的 `BLOCKCHAIN INTEGRATION POINT`。
   - **🧪 模擬上鏈(離線)**:無 backend / 錢包時的備援,用模擬區塊完成同一流程。
   鑄造完成後 **區塊鏈瀏覽器** 顯示 Token、Etherscan 與 IPFS 連結。
4. **DPP 與 QR**:用三廠的 **明文(公開)** 欄位彙整成護照;**消費者** 只見公開欄位,**法規機關** 可解密審閱加密欄位;底部產生可掃描的 QR。

### 真實鑄造需要的服務

```bash
# 0) 安裝依賴(根目錄;.env 已在根目錄,填好 PINATA_JWT)
npm install

# 1) IPFS 上傳後端(Pinata 代理)
npm start            # = node server/server.js → 監聽 http://localhost:3001

# 2) 以 HTTP 提供 fabric 資料夾(錢包 + 跨來源 fetch 需 http://localhost 來源)
npm run serve        # = python3 -m http.server 8000 → http://localhost:8000/platform.html
```

- 需 MetaMask / 注入式 EVM 錢包,切到 **Sepolia** 並有測試 ETH。
- 合約:`SimpleDPPNFT` @ `0x24aeeb254a48820b5b0bdcbdce980a725535718f`(原始碼 `contracts/SimpleDPPNFT.sol`)。
- 無網路 / 無錢包時可全程改按 **🧪 模擬上鏈** 完成 Demo。

## 重點設計

- **通知燈由狀態驅動**:工廠側欄「政策收件匣」的紅點只有在「**平台已派發政策給本廠且尚未上傳**」時才亮。
- **平台鑄造、按鈕觸發**:工廠只回傳「簽署 + 加密邊界」;平台收到後**出現按鈕**,由操作員手動鑄造真實 DPP NFT(或模擬),鑄造後才解鎖序列下一站。
- **on-chain 溯源**:真實塊以 `previousTokenId` 在 Sepolia 上串接 紡紗 → 織布 → 染整,可由 Etherscan / IPFS 獨立查驗;模擬塊維持 `hash = H(index|stage|metadataHash|prevHash)` 串接,「驗證鏈接」可檢查。
- **離線 QR**:`platform.html` 內嵌 QR 產生器,以 EC 等級 Q 輸出至 `<canvas>`。
