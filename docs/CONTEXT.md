# CONTEXT — fabric DPP 原型(跨 session 交接)

> 給下一個 session 的工作脈絡。專案位置:`/ibmnas/427/r115/gclin/Desktop/jeff/fabric`
> 注意:此環境 `git` 不可用、**沒有 node/deno/bun**(無法跑 JS 語法檢查),驗證靠結構檢查 + 瀏覽器手測。

## 專案是什麼
紡織供應鏈「數位產品護照(DPP)」互動原型。一個雲端平台 + 三個工廠端點,
四個 HTML 檔以**同源 `localStorage`(鍵前綴 `dpp_demo:`)當訊息匯流排**互通。

| 檔案 | 角色 |
|---|---|
| `platform.html` | ☁ Kanesh 雲端平台 / DPP 發行方(派政策、收集、**鑄造 NFT**、區塊鏈瀏覽、DPP+QR) |
| `factory-spin.html` | 🧵 紡紗廠(序列第 1 站) |
| `factory-weave.html` | 🧶 織布廠(第 2 站) |
| `factory-dye.html` | 🏭 染整廠(第 3 站) |
| `factory-endpoint.html` | 原始參考樣板(**未改動**,勿動) |
| `server/` | 🛰 本機 IPFS 上傳後端(`server.js` + `tests/`;原 `DPP_NFT/`) |
| `contracts/` | 📜 Sepolia NFT 合約 `SimpleDPPNFT.sol`(被平台沿用) |
| `docs/` | 📚 CONTEXT、計畫、README,及原 DPP_NFT 文件(`docs/dpp-nft/`) |

**三個工廠檔的 JS body 在 `===STAGE-CONFIG-END===` 之後完全相同**。改工廠邏輯時:
只改 `factory-spin.html`,再用下列指令把 body 複製到 weave/dye:
```bash
cd /ibmnas/427/r115/gclin/Desktop/jeff/fabric
spin_end=$(grep -n "STAGE-CONFIG-END" factory-spin.html | cut -d: -f1)
awk -v s="$spin_end" 'NR>s' factory-spin.html > /tmp/spinbody.txt
for f in weave dye; do
  end=$(grep -n "STAGE-CONFIG-END" factory-$f.html | cut -d: -f1)
  awk -v e="$end" 'NR<=e' factory-$f.html > /tmp/${f}_head.txt
  cat /tmp/${f}_head.txt /tmp/spinbody.txt > factory-$f.html
done
# 驗證 body 一致:
for f in weave dye; do diff <(awk '/STAGE-CONFIG-END/{p=1}p' factory-spin.html) <(awk '/STAGE-CONFIG-END/{p=1}p' factory-$f.html) >/dev/null && echo "$f ok"; done
```

## 平時驗證手法(無 node)
```bash
python3 - <<'PY'
s=open('platform.html').read()
for o,c in [('(',')'),('{','}'),('[',']')]:
    print(o,c, 'OK' if s.count(o)==s.count(c) else 'MISMATCH')
print('backticks even' if s.count('`')%2==0 else 'ODD')
PY
```

---

## 已完成的工作(依時間)

1. **修紅燈**:工廠側欄「政策收件匣」紅點改由 `state.policyIsReal && !state.submitted` 驅動 —
   只有「平台確實派發政策給本廠」才亮;內建離線範例(MOCK_POLICY)不點亮。
2. **平台 Kanesh logo**:`platform.html` topbar 內嵌 SVG「K」字標(藍綠漸層)。
3. **序列派發(非並行)**:政策建構器逐站 —— 設定紡紗→派發→該站完成→才解鎖織布→染整。
   `dispatchPolicy(stageId)` 累加 `policy.perStage` 後寫回 `Bus`。
4. **上鏈搬到平台**:工廠只送回「簽署+加密邊界」(`block:null`),不自行上鏈。
5. **工廠移除權限相關功能**:刪掉 事件通知 / 憑證夾 / 金鑰管理 / 驗證請求 / 保護模式選單 /
   「可見對象」欄。工廠**只能決定每欄位 🌐公開 / 🔒加密**。
6. **平台清理**:移除「模擬跑一輪」「怎麼讓工廠送資料」說明。
7. **DPP 揭露對象**:只剩 **消費者**(只看公開欄位)與 **法規機關**(可解密看加密欄位,
   原始值從平台的 stage 目錄取得);**買家已移除**。QR URL 帶 `?view=<aud>`。
8. **【最近完成】把 DPP_NFT 的真實鑄造接到平台**(計畫見 `PLATFORM_NFT_MINT_PLAN.md`):
   每個工廠回傳後,平台「收集進度」出現 **「🪙 Mint NFT」** 按鈕。

### 第 8 項的決策(已和使用者確認)
- 鑄造路徑:**真實上鏈 + 離線模擬備援**(兩個按鈕:🪙 Mint NFT / 🧪 模擬上鏈)。
- 序列解鎖:**鑄造完成後**才解鎖下一站(`received = minted().length`),
  以便每站 `previousTokenId` 指向前一站真實 `tokenId`(on-chain 溯源)。
- 設定:沿用 `DPP_NFT` 既有 Sepolia 合約 `0x24aeeb254a48820b5b0bdcbdce980a725535718f`
  與 `DPP_NFT/server.js` backend(`localhost:3001`)。
- Token 擁有者:平台連線的單一錢包(平台託管)。

### 第 8 項實作細節(`platform.html`)
- 載入 `ethers@6.17.0` UMD;頂部加 `CONTRACT_ADDRESS`/`CONTRACT_ABI`/Sepolia 參數/
  `IPFS_UPLOAD_ENDPOINT`/`let REAL_MINT=true`;`STAGES` 每項加 `schema`、`factoryDid`。
- 移植自 `DPP_NFT/factory-endpoint.html`:`stableStringify`、`buildStageMetadata(stage,sub,prevTokenId)`、
  `computeDPPHashes`、`uploadMetadataToIPFS`、`walletState`/`connectWallet`/`switchToSepolia`/`isSepolia`。
- `mintStageToken(stageId)`:連錢包→建 metadata/keccak256→上傳 IPFS→`contract.mintDPP(...)`→
  `tx.wait()`→解析 `DPPMinted` 取 `tokenId`→把 **block 回填** `submission:<stage>`
  (block 含 `tokenId,txHash,tokenURI,cid,gatewayURL,metadataHash,prevTokenId,real:true`)。
  逐步進度用 `renderMintModal(p)` modal。
- `simulateMintStage(stageId)`:用既有 `mintBlock(sub)`(simpleHash 模擬,`real:false`)。
- `Bus.onChange`:工廠回傳(`block:null`)時**不再自動上鏈**,只通知 + render,讓按鈕出現。
- 新增 helper:`minted()=subs().filter(s=>s.block)`、`pendingStages()`。
- 已把所有 `sub.block` 取用改成走 `minted()` 或加守衛:vHome、vPolicy、vCollect、
  vChainExplorer(真實塊顯示 Etherscan/IPFS 連結;模擬塊顯示 hash)、vDPP/dppHashOf/
  showDppJson、verifyChain(真實塊標記 on-chain、只驗模擬塊)、render() 的 QR。
- 工廠 `vChain`(三檔已同步):真實塊顯示 Etherscan tx 連結、tokenURI、previousTokenId;
  模擬塊維持 hash 顯示。

---

## 怎麼跑(真實鑄造)
> 2026-06 重構:已併為單一根目錄專案(根目錄一個 `package.json` + 一個 git repo)。
> 後端在 `server/server.js`、合約在 `contracts/`、文件在 `docs/`;前端 HTML 仍在根目錄。
```bash
# 0) 安裝依賴(根目錄;.env 已在根目錄,填好 PINATA_JWT)
npm install

# 1) IPFS 上傳後端(根目錄)
npm start            # = node server/server.js → http://localhost:3001

# 2) 以 HTTP 提供 fabric(錢包 + 跨來源 fetch 需 http://localhost 來源)
npm run serve        # = python3 -m http.server 8000 → http://localhost:8000/platform.html
```
- 需 MetaMask 切到 **Sepolia** 且有測試 ETH。
- 無 backend/錢包/網路時,全程改按 **🧪 模擬上鏈** 仍可完成 Demo。

## 端到端測試流程
1. 平台 → 政策建構器 → 派發**紡紗** → 開 `factory-spin.html` 完成揭露決策→送出。
2. 平台「收集進度」出現 **🪙 Mint NFT**。按下 → 錢包確認 → 真實 Token + Etherscan 連結;
   織布站解鎖。
3. 重複 織布、染整;確認每站 `previousTokenId` = 前一站真實 `tokenId`。
4. 三站鑄完 → DPP 與 QR 可發行(消費者/法規兩視角)。

## 已知限制 / 待辦候選
- **平台必須開著**才能鑄造(按鈕在平台;`mintStageToken` 用平台分頁的錢包)。
  工廠送出後若平台沒開,工廠會停在「等待平台上鏈」,平台之後開啟並按按鈕即可。
- `ethers` 從 jsDelivr CDN 載入 → 真實鑄造需連外網;離線改用模擬。
- 尚未在真實鏈上跑過(本環境無錢包/瀏覽器),**需使用者在瀏覽器手測**真實 mint 路徑。
- 合約 `mintDPP` 為 unrestricted(任何人可鑄),demo 用沒問題;正式需加 issuer 權限。
- `factory-endpoint.html`(根目錄那個參考樣板)刻意未改;另一份不同檔的同名參考已移到 `docs/dpp-nft/factory-endpoint.html`。

## 重要檔案索引
- 計畫文件:`docs/PLATFORM_NFT_MINT_PLAN.md`(第 8 項的完整計畫,含原始碼行號參照)。
- 合約:`contracts/SimpleDPPNFT.sol`(`mintDPP(to,tokenURI_,metadataHash,schemaHash,orderHash,stage,previousTokenId)`,emit `DPPMinted`)。
- 後端:`server/server.js`(`POST /upload-metadata` → `{cid,tokenURI,gatewayURL}`;`GET /fetch-metadata`);測試 `server/tests/`。
- 移植來源:`docs/dpp-nft/factory-endpoint.html`(doSign 在 ~1041–1146 行)。
