# 計畫 5 — 工作流與方法論 UX(CWA 五步驟法)

> 索引:[CWA_ALIGNMENT_OVERVIEW.md](CWA_ALIGNMENT_OVERVIEW.md)
> 主軸:CWA §4.3 的建置方法是具名五步驟:Step 1 目標與資料法律效力 → Step 2 描述現行供應鏈 →
> Step 3 建置溯源系統 → Step 4 永續資料收集 → Step 5 參考協作流程(+Step 6 資料模型)。
> 現在平台的流程(建訂單→政策→收集→鑄造→DPP)其實已經隱含這條路——本計畫是把它「講出來」,
> 讓懂法規的觀眾一眼看出 demo 是這套標準的實作。
> 驗證狀態:◐(§5.2/§5.3.5.3/Figure 3/Annex B 由讀取代理彙整,關鍵句已抽讀;程式現況已抽查)。

## E1. 每訂單新增「供應鏈地圖(Step 2)」頁〔P1 / M〕

- **法規**:`sections/08` §5.2:描述現行供應鏈需「識別行為者與角色;偵測交換的實體資產與資訊;
  描述溯源系統邊界內的關鍵作業……」——這產出資料來源/所有者、機密需求、first-draft 收集清單。
  `sections/09` §5.3.1:溯源系統要收「供應鏈行為者地圖」;§5.3.3:須定義**系統邊界**(起點/終點、
  分包商含不含)。
- **現況**:唯一的供應鏈表示是裝飾性一行狀態列(`SC` 陣列 + `scHTML()`,platform.html ~298-308,
  factory-app.js 鏡像):「聚酯」寫死完成、「成衣」死的;沒有任何畫面顯示行為者是誰(廠牌/factoryId/
  DID/角色/廠區)、交換什麼、邊界在哪。Step 2 產物完全不存在。
- **改法**:平台 NAV 在 home 與 policy 之間加「供應鏈 / Supply chain (Step 2)」視圖,從 `STAGES` +
  計畫 1 A1 的 ORG/facility render:
  - 行為者表(hairline 面板):角色用 CWA 詞彙(yarn producer / fabric producer / dyer)、
    legalName、facility 城市/國別、識別碼
  - 邊界帶:入口「纖維收料 @ 紡紗廠」→ 出口「成品布出貨 @ 染整廠」;上下游(軋棉、成衣)標示
    「邊界外 — 以第三方證書涵蓋」(§5.3.3 原文允許的做法,正好解釋「聚酯/成衣」為何是灰的)
  - 物流箭頭標注交換的實體資產(紗批→坯布批→成品布批;批號來自 A2)
  - 選擇性編輯存 `order:<id>:supplyChain`(**加進 orderKeys()**)
  - vHome 卡①加一句「派發政策前先描述供應鏈」連到此頁。
- **UI**:平台每訂單多一頁「as-is 供應鏈描述」——CWA Step 2 的標準產物。工廠端不變
  (各廠看不到彼此身分,正好符合逐行為者機密原則)。

## E2. 政策建構器改以 Step 1 開場:收集目標 + UNECE 六欄主張〔P1 / M〕

- **法規**:`sections/07` §5.1:資料收集必須從**目標**出發(原文例:「Transparency as a value for
  the Customer (i.e. organic product)」「Regulatory or Customs Support (i.e. … ESPR)」、反仿冒等),
  主張用 UNECE 六欄結構定義:Traceable asset / Claimed state / Verification criteria / Objective /
  Macro category / Main claim target;還要定義各使用情境的證據法律效力等級。範例:Annex A Table A.1。
- **現況**:vPolicy(platform.html:391-453)是裸的欄位勾選表+保留年限 select;政策物件
  (addStageToPolicy,:652-659)只有 `{id,order,issuer,retentionYears,deadline,sig,perStage}`——
  沒有目標、沒有主張、沒有「為什麼要這個欄位」。工廠收件卡也從不說資料支持什麼主張。
- **改法**:vPolicy 頂部加「Step 1 · 目標與主張」面板(首次派發前顯示):
  - (a) 3-4 個 CWA 目標預設勾選(ESPR 符合性 / 透明度—有機產品 / 顧客安全—化學品 / 反仿冒)
  - (b) 一張預填的六欄 UNECE 主張卡:Traceable asset「染整布批」、Claimed state「有機棉含量」、
    Verification criteria「OCS 證書 (ocsCert) + GRS 交易證 (grsCert)」、Macro category
    「環境永續」、Main claim target「消費者/法規機關」
  - 存 `policy.objectives` / `policy.claims`;工廠 vInbox 政策卡render主張 chip
    (「本資料支持主張:有機棉含量(驗證:OCS 證書)」);`showPolicyJson` 加兩區塊。
    doc 類欄位映到主張的驗證判準。
- **UI**:政策建構器先講「為什麼」再給勾選表;工廠看到資料的用途;流程讀起來是
  CWA Step 1 → Step 3,不是無來由的欄位購物清單。

## E3. 政策派發前加「供應商啟用(supplier activation)」握手〔P1 / M〕

- **法規**:`sections/09` §5.3.5.3:「應識別一個資料揭露機制,於**供應商承認**其客戶取得資料
  存取權時啟動……此機制服務於 supplier activation 階段(見 Figure 3)」;Figure 3 把
  「Activation of all suppliers / Data disclosure request」畫成獨立泳道階段;Annex B 活動圖
  每個生產者泳道都有明確的「Supplier activation (S0.0.2)」步驟在任何上傳之前。
- **現況**:無任何啟用/同意步驟。dispatchPolicy 直接把政策寫進訂單命名空間
  (platform.html:652-666),工廠的 Bus.onChange 立刻當作待辦(「收到收集政策……完成揭露並上傳」)。
  工廠永遠無法接受或拒絕參與;平台 vCollect 只知道「已派發,等待工廠上傳」。
- **改法**:dispatchPolicy 同時寫 `order:<id>:activation` = `{[stageId]:{status:'invited',ts}}`
  (**加進 orderKeys()**)。工廠 vInbox 先顯示啟用卡——「供應商啟用 (S0.0.2):接受本訂單的
  資料揭露請求」+ 接受/拒絕鈕(oset 改 `active|declined`),接受後才解鎖揭露步驟(stepper 上鎖)。
  平台 vPolicy/vCollect 多中間狀態「等待供應商啟用」;兩側都 logEvent。~60 行。
- **UI**:工廠收件匣多一張同意卡(鏡射現有金鑰放行的同意模式);平台時間線多一個狀態——
  協作流程從單向推送變成 Annex B 的雙向。

## E4. 平台加 CWA 五步驟方法列(method stepper)〔P2 / S〕(依賴 E1、E2 提供狀態源)

- **法規**:`sections/06` §4.3 具名步驟清單;Annex A 完整照這順序跑過一次。
- **現況**:平台 NAV 與 vHome ①②③ 卡是自創流程,懂法規的觀眾對不上標準。
- **改法**:重用工廠端 stepper 模式(factory-app.js stepper(),:113-120)在 vHome 供應鏈卡下加
  五段方法列:Step 1 目標(policy.claims 存在=done)/ Step 2 供應鏈(supplyChain 確認=done)/
  Step 3 溯源(3/3 minted=done)/ Step 4 永續資料(指標已發布=done)/ Step 5 協作流程
  (啟用+金鑰請求=進行中)。各視圖標頭加 mono eyebrow 小標:vPolicy「CWA Step 1+3」、
  供應鏈頁「CWA Step 2」、vKeys「CWA Step 5」。純呈現層。
- **UI**:dashboard 直接敘事五步驟法——demo 立刻讀起來像標準的實作,不是通用區塊鏈管線。

## E5. CWA 術語轉換(traced object / process step / disclosure level)〔P2 / S〕

- **法規**:`glossary.md` 3.2(traceable asset 定義)、`processstep.md`、§5.6.3.4.3 五級揭露。
- **現況**:自創詞彙——政策收「特徵/features」(platform vPolicy:402、factory showPolicyJson:440);
  工作單位是「submission」;揭露叫「公開/加密」。
- **改法**(純文案,無邏輯):(1) 計畫 1 A4 的 opCode 顯示「Process step 1.4 · Spinning」;
  (2) vBoundary/vChain/區塊卡標示「Traced object (batch): …」;(3) 揭露鈕文案改
  「公開 / 加密 — 經明確授權揭露」,vDisclose 加一行footnote列五級+「預設機密」
  (完整五級 UI 是計畫 4 D2,此項是低成本前菜,若 D2 排程近可跳過);
  (4) 政策 JSON 的 `features` 改名 `process-step data`。全部走 t(zh,en)。
- **UI**:工作台/邊界預覽/瀏覽器說標準的語言——對懂 CWA 的人是最便宜的可信度。

## E6. 訊息流掛 Step 5 具名交易(transaction ledger)〔P3 / S〕

- **法規**:`sections/11` §5.5.2.2 Tables 7-12:協作活動由「對應文件或訊息的交易」組成,名稱固定
  ——Party information / Transparency and Sustainability Report / Traceability Despatching·Receiving
  advice / Traceability Report / Document availability advice 等。
- **現況**:所有跨分頁訊息是自由文字 log 字串(logEvent,platform.html:237);送件與金鑰請求
  不帶任何交易/文件類型。
- **改法**:`logEvent(msg, txn)` 加第二參數,交易對映:政策派發→「Data collection request」、
  工廠送件→「Traceability Report (incremental)」、doc 雜湊→「Document availability advice」、
  mint 回填→「Token anchoring advice」、金鑰請求/放行→「Data disclosure request / authorisation」。
  submission(doSign)與 keyRequests(requestKey)存 `txnType`;通知時間線與工廠 vChain render
  mono chip;Notifications 加圖例 callout「CWA 18291 Step 5 · Tables 7-12」。
- **UI**:通知頁變成每列掛標準文件名的交易帳,demo 的訊息流從此可對照 eBIZ 交易集。

---

## 實作順序與驗證

1. E3(供應商啟用)最有戲劇效果且獨立——工廠多一個「同意」節拍,是 CWA 協作精神的核心。
   注意 stepper 上鎖後,原「收到政策紅點」邏輯要改成「收到啟用邀請紅點」。
2. E1(供應鏈地圖)吃計畫 1 A1 的身分資料,排在 A1 後。
3. E2 → E4(E4 的 Step 1/2 狀態源來自 E2/E1)。
4. E5/E6 文案層收尾。
5. 每項:新 bus 鍵(activation、supplyChain)必加 `orderKeys()`;重置訂單走查;雙語走查;
   `node --check`。
