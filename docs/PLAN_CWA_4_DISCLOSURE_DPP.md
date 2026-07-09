# 計畫 4 — 揭露分級與 DPP 呈現(三大資訊群 / 五級揭露 / QR)

> 索引:[CWA_ALIGNMENT_OVERVIEW.md](CWA_ALIGNMENT_OVERVIEW.md)
> 主軸:護照頁從「一廠一欄」改為 ESPR 三大資訊群;揭露從二元切換升級為 CWA 五級詞彙;
> QR 改成單一 GS1 Digital Link 式載體。**含一個已驗證的實作矛盾修正(D4),建議最先做。**
> 本計畫 6 項全部經對抗式驗證(引用原文 + 程式行號逐條核對)。

## D4. 【真 bug】法規視角「已放行」值改由工廠端放行時寫回〔P2 / S〕✓(獨立,建議最先做)

- **法規**:`sections/09` §5.3.5.3(資料所有權):「資料所有者應被明確識別,並能對自己的資料
  定義揭露政策」——被揭露的內容來自**所有者**,平台只持有被揭露的部分。
- **現況(實作矛盾)**:工廠 `doSign` 對加密欄位正確地送 `val:null`(factory-app.js:413),
  但 `dppPreview()` 在金鑰核准後顯示的是 `catVal(f.key)`(platform.html:541、549)——
  **從平台自己的 SPIN/WEAVE/DYE_FIELDS 目錄副本查出來的明文**。這與 demo 自己在 vKeys(:597)和
  vBoundary 宣稱的「平台讀不到任何加密欄位」直接矛盾,且平台副本一旦與工廠實際值不同會靜默漂移。
- **改法**:factory-app.js `decideKey()` 核准時把明文寫回請求紀錄:`r.releasedVal = fVal(f)`、
  `r.releasedValEn`(從工廠自己的 FIELDS 查);拒絕/撤銷時刪除。platform `dppPreview` 改讀
  keyRequest 的 `releasedVal`,**刪除 catVal helper**。keyRequests 本來就跨分頁同步,零新管線。
- **UI**:快樂路徑無視覺變化,但值現在可證明是「核准當下由工廠→平台」;撤銷金鑰,值就消失。

## D1. 護照改依三大 DPP 資訊群分區(生態設計 / 識別 / 溯源)〔P1 / M〕✓

- **法規**:`sections/12` §5.7:DPP 需要三類資訊——(1) 產品固有特性的生態設計要求、
  (2) 產品與投放市場營運者的識別資訊、(3) 產品實例的具體歷史;Table 46 給出每群對應的資料元素。
- **現況**:`dppPreview()`(platform.html:524-589)一廠一欄;欄位自身的 grp 值在護照中甚至沒用到;
  護照 UI 與 `showDppJson()` 都沒有任何資訊群概念。
- **改法**:所有欄位物件(stages/*.js + platform 副本)加 `dppGroup:'eco'|'id'|'trace'`:
  - eco = 條乾/強力/毛羽/強度/疵點率/ΔE/牢度/cod、blend、ocsCert/grsCert、測試報告(Table 43 High 列)
  - id = yarnCount、structure、width、gsm、density + 標頭的產品/訂單識別
  - trace = spindleId、loomId、machineId、greigeBatch、batch、製程參數
  - `dppPreview()` 主迴圈改為把三張已 mint 送件的欄位打進三個頂層護照區
    (`生態設計與永續` / `識別與認證` / `溯源與供應鏈`),每列掛來源廠 chip(廠牌 + Token #)。
    `showDppJson()` 同構(public.eco / public.id / public.trace)。
- **⚠ 實作陷阱**(驗證代理抓到的):`doSign()` 是**顯式屬性複製清單**(factory-app.js:411
  `{key,label,grp,kind,sensitive,…}`)——`dppGroup` 必須也加進這份映射,否則屬性永遠到不了護照;
  或者平台端用自己的欄位目錄按 key 反查。
- **UI**:護照從三個工廠欄變成三個 CWA 資訊群區;每列多來源 chip;工廠頁除隱形屬性外不變。

## D2. 二元「公開/加密」升級為五級 @disclosureLevel〔P1 / M〕✓

- **法規**:`trick-reports-and-events.md` §5.6.3.4.3:五級——public / 任何商業夥伴 / 特定類別夥伴 /
  經明確授權 / 完全機密;§5.6.3.4.1:「供應鏈上所有資料**預設機密**,由所有者依用途揭露」。
  (`_index.md` Table 18 有原文錯字「diclosureLevel」——參考庫忠實保留,引用時注意。)
- **現況**:vDisclose(factory-app.js:212-241)每欄恰兩鍵:公開 / 加密(setDisc);受眾模型
  消費者(僅公開)/ 法規(放行後)。五級中的三級無任何表示;「完全機密」在今天甚至**不可能**
  ——所有必填欄位一律送出。
- **改法**:
  - stages/*.js 的 `rec` 改五值 `disclosureLevel`:`public|partner|category|authorisation|confidential`
    (既有 private 預設映到 authorisation;讓 spinParam/recipe 預設 confidential 以展示該級)。
  - vDisclose 換五段控制(或 select),用 CWA 原文措辭標示。
  - 線上格式:public→明文;partner/category/authorisation→密文+`disclosureLevel` 標籤;
    **confidential→欄位整個不送出,只在 metadataHash 計入其雜湊**。
  - `dppPreview` 受眾擴成三個:消費者(public)/ **商業夥伴(public+partner)** / 法規
    (public + authorisation 經現有 keyRequests 放行);隱藏列顯示 @disclosureLevel 徽章。
    vKeys 只列 authorisation 級欄位。
- **UI**:揭露工作台五級 CWA 命名;vBoundary 多第三桶「永不離廠」;護照多商業夥伴視角;
  金鑰頁語意更精確。

## D5. 護照區塊掛完整性/受限旗標(@exhaustiveInformation / @limitedByDisclosureIndicator)〔P3 / S〕✓(依賴 D1;與計畫 1 A7 同源)

- **法規**:`trick-reports-and-events.md` §5.6.3.4.4 / §5.6.3.4.3;Annex C Figure C.1 報告標頭
  確實印出這兩個布林。
- **現況**:護照只有「n 個加密欄位隱藏」計數;且平台可以只派**部分欄位**的政策
  (state.sel / toggleSel,platform.html:646-650),護照默默render較少欄位而毫無標示。
- **改法**:doSign 存 `exhaustiveInformation = (requiredKeys().length === FIELDS.length)`、
  `limitedByDisclosure = priCount()>0`;dppPreview 在每個資訊群區標頭render兩枚 mono chip
  (樣式沿用現有 pill),caption 引 CWA 原意;`showDppJson` 每站輸出兩布林。
  (D1 未做前,chip 改掛在各廠欄標頭。)

## D3. QR 改為單一 GS1 Digital Link 式載體〔P2 / S〕✓(依賴計畫 1 A6 的 GTIN、A2 的批號)

- **法規**:`sections/09` §5.3.2:「每個可溯資產應關聯唯一識別碼與**一個資料載體**(QR、RFID…)」;
  §5.3.5.6 工具特性列「GS1 Digital Links web interface」。存取控制屬 @disclosureLevel/授權層,
  **不屬於印出來的載體**。
- **現況**:platform.html:531-532 刻意每受眾產不同 QR:
  `url = 'https://dpp.example/p/<orderNo>?view='+aud+'#'+dppHash`(註解原文:「QR 內含 view=對象,
  使不同對象產生『不同的 QR』」)。存取控制被編進印刷物——拿到消費者 QR 的人改個
  `view=regulator` 就穿透;且 URL 識別的是訂單,不是產品/批次。
- **改法**:單一canonical URL:`https://dpp.example/01/<gtin>/10/<最終染整批號>#<dppHash>`
  (AI 01=GTIN、AI 10=batch/lot)。QR 去掉 view=;保留受眾切換鈕但改名
  `t('以此身分預覽','Preview as')`,加 caption:「正式環境中受眾由解析時的驗證決定,不由 QR 決定」。
  QR 側卡顯示解碼段(GTIN / lot / hash)。
- **UI**:每訂單一個跨受眾穩定 QR;側卡顯示 GS1 式 URL 分解;受眾鈕語意從「兩張不同的碼」
  修正為「預覽視角」。

## D6. 金鑰請求帶目的與請求者角色(need-to-know)〔P3 / S〕

- **法規**:`sections/10` §5.4.1:第三方(專家/稽核/覆核者)驗證;「資料揭露可基於 need-to-know
  原則限定給指定第三方」。(此項屬計畫 3 的顧問模式敘事,放這裡因為改的是金鑰流程。)
- **現況**:requestKey(platform.html:784-792)只存 `{stage,key,from:'platform',status,ts}`;
  工廠 vVerify 表(factory-app.js:340-356)只有欄名/鍵/時間——工廠**盲批**,不知道誰、為何要。
- **改法**:請求時彈小 modal 選目的/角色:「法規稽核」或「專家 — 評估研究 (PEF)」;存
  `r.purpose`、`r.requesterRole`。vVerify 加「目的/請求者」欄,放行 toast 點名
  (「已放行給專家作 PEF 研究 — need-to-know」);法規視角的 (released) 欄位旁可掛目的 chip。
  純加欄位。

---

## 實作順序與驗證

1. **D4 先做**(独立、小、修正 demo 誠實性)→ 手測:放行→值出現;撤銷→值消失;
   平台目錄故意改壞一個值,確認護照顯示的是工廠送來的,不是目錄的。
2. D1(大改 dppPreview,注意 doSign 屬性映射陷阱)→ 雙語+雙(三)視角走查。
3. D2(觸面最廣:stages/*.js、vDisclose、doSign 線上格式、dppPreview 受眾、vKeys 過濾)
   → 回歸:金鑰放行、verifyChain、模擬/真實 mint 兩路徑。
4. D3(等 A6/A2 的識別碼落地)、D5、D6 收尾。
