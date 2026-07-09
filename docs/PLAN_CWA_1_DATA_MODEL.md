# 計畫 1 — 資料模型與識別對齊(TRICK 具名元素)

> 索引:[CWA_ALIGNMENT_OVERVIEW.md](CWA_ALIGNMENT_OVERVIEW.md) · 法規出處一律在 `docs/cwa18291-reference/`
> 主軸:讓「政策 → 送件 → 上鏈 metadata → DPP JSON」整條資料鏈,每一塊都對得上 CWA 5.6 資料模型的具名元素。
> 本計畫 7 項全部經對抗式驗證(引用原文 + 程式行號逐條核對)。

## A1. 每站送件加入組織與廠區身分(organisationDescriptor / facilityDescriptor)〔P1 / S〕✓

- **法規**:`data-model/organisationdescriptor.md`(5.6.2.8, Table 30)—— `id` (1..1,建議 EORI 或
  ISO 3166 國碼+統編)、`legalName` (1..1)。`data-model/facilitydescriptor.md`(5.6.2.9, Table 31)——
  `facilityLocation` (1..1)。`sections/12` Table 45:「製造商資訊」「主要製程發生的廠區/位置」皆評 **High**;
  Table 46 把兩者同時放進「產品識別」與「溯源」兩個 DPP 資訊群。
- **現況**:送件(`doSign`,factory-app.js:423-427)只有 `stage/stageLabel/factoryId/orderNo/policyId`;
  DID 只是 Settings 頁的寫死字串(factory-app.js:366)。DPP 裡完全沒有「誰、在哪裡」。
- **改法**:各 `stages/<id>.js` 加 `window.ORG = { orgId:'TW16829399'(國碼+統編式), legalName,
  legalNameEn, facility:{ facilityId:'TW16829399$MILL-1'(Annex A Table A.4 樣式), city, cityEn,
  countryCode } }`。`doSign` 把 `organisation` + `facility` 塞進送件;`buildStageMetadata` 抄進
  `dpp.organisation / dpp.facility`;platform.html `STAGES` 同步放一份供 `dppPreview` 顯示。
- **UI**:工廠 Settings 顯示身分卡;平台 DPP 每站 Token 下加「legalName · 城市, 國別」一行;DPP JSON 多兩個區塊。

## A2. 每站產出批次升格為 tracedObject(批號+數量+類型,不可被加密掉)〔P1 / S〕✓

- **法規**:`data-model/tracedobject.md`(5.6.2.3, Table 21)—— `objectInstanceIdentification` (1..1)、
  `productIDandQty` (1..99)、`objectTypeCode` (1..1)。Annex A Table A.4 批號規則
  `<organisationID>$<internal batch code>`(如 `IT01606600029$TR400`)。Table 45:「唯一批次識別碼」High。
- **現況**:批號只是普通可切換欄位——weave `greigeBatch`(stages/weave.js:15)、dye `batch`(stages/dye.js:15),
  **spin 完全沒有產出批號**;沒有任何數量;政策可以不勾它、工廠可以把它加密,鏈的批次身分會憑空消失。
- **改法**:各 `stages/<id>.js` 加 `window.TRACED_OBJECT = { lotId:'<orgId>$Y-2207-01'(spin)/'$G-2207-08'
  (weave)/'$B-2207-13'(dye), objectTypeCode:'YARN'|'GREIGE_FABRIC'|'DYED_FABRIC',
  qty:'1,200 kg'|'3,400 m'|'3,350 m' }`。`doSign` 把 `tracedObject` 放在送件**頂層、fields 之外**
  (不受揭露切換影響,呼應 1..1 必填)。`buildStageMetadata` 寫進 `dpp.tracedObject`。
- **UI**:工廠 vDisclose/vBoundary 加唯讀「Traced object (batch)」列(標示恆公開);平台 vDPP 每站
  Token 旁顯示「LOT …$G-2207-08 · 3,400 m」;vChainExplorer 區塊卡顯示 lot id(對齊 Annex C 的
  「LOT … Quantity: 42.5 (mtr)」樣式)。

## A3. billOfComponents:把每站產出連回它消耗的上游批次〔P1 / M〕✓(依賴 A2)

- **法規**:`data-model/billofcomponents.md`(5.6.2.5)——「建立產品與其組成的連結」,可「詳列單一
  加工階段所用的組成(例如織布所用的紗)」;`productcomponent.md`(5.6.2.4)每個組成帶
  `uniqueProductID`、`qty`、`supplier`、`@internallyPerformed`。Annex A §A.3.2:「發生轉換時
  (例如紗→布),**必須**能取回初始貨品的批次」(M-2-N)。
- **現況**:站與站只在 token 層相連(`previousTokenId` platform.html:715-717、`prevHash`:676-686)。
  沒有任何送件說出「這匹坯布用了紡紗站的哪個紗批、耗了多少」;spin 的原料(OCS 證書指的有機棉)完全沒被表示。
- **改法**:`doSign` 時組 `billOfComponents`:weave/dye 用 `oget('submission:'+STAGE.prev)` 讀上一站
  `tracedObject`,產 `[{uniqueProductID: prev.lotId, objectTypeCode, qty:'1,180 kg used',
  supplierFactoryId: prev.factoryId, internallyPerformed:false}]`;spin 在 `stages/spin.js` 定義靜態
  原料組成(棉批 + `certificateRef:'ocsCert'`)。上一站未送件時顯示「(前站尚未送件)」。
  一併進 `dpp.billOfComponents`。
- **UI**:工廠 vBoundary 加「Bill of components(投入)」段;平台 vDPP 每站顯示「made of <上游批> (qty)」
  ——護照呈現**材料鏈**(棉批→紗批→坯布批→成品布批),不只 token 鏈。

## A4. 各站描述為 processStep(eBIZ 製程作業代碼)〔P2 / S〕✓

- **法規**:`data-model/processstep.md`(5.6.2.6)—— `processStepID` (1..1)、`manufacturingOperationCode`
  (1..1,eBIZ T305 分類);`@progr` 必填順序號。Table 46 把 `<ProcessStepList>` 放進**全部三個** DPP 資訊群。
  分類表節錄在 `sections/09` §5.3.5.2 Table 5(如 `1.1 紡前準備`、`1.4.1 Mechanical Spinning`)。
- **現況**:製程只有 `stage:'spin'` 字串+機台參數欄位;無作業代碼、無順序、無地點。
- **改法**:各 `stages/<id>.js` 加 `window.PROCESS_STEPS`,如 spin:
  `[{processStepID:'PS-SPIN-1', opCode:'1.1', opName:'紡前準備', opNameEn:'Spinning preparation', progr:1},
  {processStepID:'PS-SPIN-2', opCode:'1.4.1', opName:'環錠紡', opNameEn:'Mechanical spinning', progr:2}]`。
  `doSign` 加 `processStepList`(activityLocation 用 A1 的 facility);進 `dpp.processStepList`。
- **⚠ 注意**(驗證代理指正):參考庫的 Table 5 節錄只到 `1.4.1`——**織布與染整的代碼不在參考庫內**,
  需以「示意代碼」標注(如 `2.x weaving`、`4.x dyeing & finishing`),不可宣稱是 T305 真實代碼。
- **UI**:工廠政策收件卡與 vBoundary 顯示「Operations: 1.1 · 1.4.1」;平台 vDPP / DPP JSON 列出各站
  processStepList。

## A5. 文件欄位升級為結構化 certificate 物件〔P2 / M〕✓

- **法規**:`data-model/certificate.md`(5.6.2.10)—— 必填 `docID`、`certificateID`(發證方給的)、
  `certificationStandardName`(原文例:「GRS – global recycling standard」「Standard 100 OEKO-TEX」)、
  `docDate`;選填效期、`issuerParty`、`attachment`(原文注明放 binary「not recommended」——只放雜湊正確!)。
- **現況**:證書是 `kind:'doc'` 的平面欄位,內容就一個顯示字串 `val:'hash c4e2… (只存雜湊)'`
  (stages/spin.js:21 ocsCert、stages/dye.js:21 grsCert)。無證書編號/發證方/標準名/效期。
- **改法**:每個 `kind:'doc'` 欄位加 `cert:{certificateID:'OCS-2025-118821', standard:'OCS – Organic
  Content Standard', issuer:'Control Union', docDate:'2025-11-02', validityEnd:'2026-11-01',
  docHash:'c4e2…'}`(測試報告 standard 用 `internal lab report`)。`doSign` 抄進送件
  (public→整組;private→只留 `docHash`+`standard`,法規放行流程不變)。`buildStageMetadata`
  收進 `dpp.certificates[]`。
- **UI**:工廠揭露表顯示「OCS · Control Union · 效期至 2026-11-01」;DPP 護照(雙視角)每站加
  「Certificates」區塊——對稽核者最有感的 CWA 對齊證據。

## A6. 訂單補產品識別,DPP JSON 輸出改為 TRCProduct 形狀〔P2 / S〕✓(收尾在 A1–A5 之後)

- **法規**:`data-model/trcproduct.md`(5.6.2.2)—— `<TRCProduct>` 是「起點實體」,必填
  `ProductIdentification` (1..1)。`sections/09` §5.3.2:DPP 標的成品**須有 ISO/IEC 15459-6 相容的
  全球唯一識別碼(如 GS1 GTIN)**。Annex A Table A.4 貨號樣式 `<organisationID>$<internal article code>`。
  `data-model/_index.md` Table 18:識別碼**至多 2 個**,各標注編號組織。
- **現況**:訂單物件只有 `{id,no,product,productEn,buyer,buyerEn,retention,deadline,createdTs}`
  (platform.html:84-93);`showDppJson`(:805-811)輸出自創形狀 `{order,product,issuer,dppHash,chain,public}`。
- **改法**:(1) 新增訂單 modal 加選填 GTIN(給預設值),`seedOrders` 種
  `gtin:'04719512002207'` + `articleId:'TW24536806$POLO-A2207'`;(2) `showDppJson` 重構為
  `{ TRCProduct:{ ProductIdentification:{uniqueProductID, gtin, productName, orderNo},
  billOfComponents…, productStepsList…, certificate…, chain:[…] } }` ——純聚合 bus 上已有的資料。
- **UI**:訂單卡與訂單 dashboard 標頭顯示 GTIN 式產品識別;「DPP JSON」modal 變成頂層鍵名
  直接等於 CWA 元素名的文件——**單一最可展示的「我們說 TRICK 語言」證物**。

## A7. 送件帶上 CWA 跨領域屬性(@disclosureLevel / @exhaustiveInformation)〔P3 / S〕✓

- **法規**:`billofcomponents.md` Table 25、`processsteplist.md` Table 29:清單型區塊
  `disclosureLevel` 與 `exhaustiveInformation` **Required**、`limitedByDisclosureIndicator` 選填。
  `trick-reports-and-events.md` §5.6.3.4.3 五級揭露(§5.6.3.4.1:「供應鏈上所有資料**預設機密**」)。
- **現況**:欄位揭露是二元字串 `public/private`(setDisc,factory-app.js:381-393),送件無任何
  區塊層完整性/揭露 metadata。
- **改法**:`doSign` 時做詞彙映射(不加 UI):每欄位 `disclosureLevel:'public'|'uponExplicitAuthorisation'`
  (現有金鑰放行流程 = 「經明確授權揭露」級);送件頂層加
  `exhaustiveInformation:(requiredKeys().length===FIELDS.length)`、
  `limitedByDisclosureIndicator:(priCount()>0)`。進 `buildStageMetadata`。
  (五級完整 UI 是計畫 4 §D2;本項只是 payload 詞彙,先做不衝突。)
- **UI**:vBoundary 防竄改面板與 DPP JSON 顯示這三個屬性徽章;vKeys 頁可用 CWA 原名講選擇性揭露。

---

## 實作順序與驗證

1. A1 → A2(全 S,一次 PR)→ 手測:三站送件 JSON、DPP JSON、鏈上 metadata 各多出正確區塊。
2. A3(讀前站送件,注意上一站未送件的 fallback)→ 手測順序:spin 送→weave 送,檢查 weave 的
   billOfComponents 指到 spin 的 lotId。
3. A4、A5、A7 任意順序;A6 最後收尾(聚合前面全部)。
4. 每步:`node --check`(platform.html 先抽 inline script)、`npm run serve` 雙語走查、
   `orderKeys()` 若有新鍵記得加(本計畫都寫在 submission 內,無新鍵)。
