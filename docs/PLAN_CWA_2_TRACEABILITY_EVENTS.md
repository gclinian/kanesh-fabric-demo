# 計畫 2 — 事件式溯源(TRCEventList / Traceability Report)

> 索引:[CWA_ALIGNMENT_OVERVIEW.md](CWA_ALIGNMENT_OVERVIEW.md) · 依賴:計畫 1 的 A2(tracedObject)先行。
> 主軸:CWA 的溯源核心是**事件**(§5.3.6.1 Figure 6:Event 是中心實體,連接 Product/Component、
> Traceable Asset、Process Step、Location、Supporting documentation)。目前 demo 只有 NFT token 鏈
> 和 UI 通知字串,沒有任何溯源事件。本計畫讓 demo 能回答「這匹布是哪個紗批做的?中間發生過什麼?」。
> 驗證狀態:◐(引用段落已由主 session 讀原文核實;§5.3.5.5、Annex C/D、§5.6.3 皆逐字對過)。

## B1. 每站送件記錄三個具型別事件:收料 → 轉換 → 出貨〔P1 / M〕

- **法規**:`sections/09` §5.3.5.5:「每個選定製程步驟**至少一個事件**,涉及產品轉換者必記;
  每次公司間物流移轉**至少一個事件**」,且每事件附證據。事件型別:`data-model/trceventlist.md`
  (5.6.2.15)—— TRCObjectEvent / TRCTransformationEvent(/Aggregation/Transaction)。
  逐角色範本:`annexes/annex-d-events.md` —— Spinner =「Object event: top receiving;
  Transformation event: top into yarn; Object event: yarn sending」。
- **現況**:全 app 沒有溯源事件。唯一的「events」是 `logEvent()` 的 UI 通知字串
  (platform.html:237,上限 12 筆)。送件(`doSign`,factory-app.js:410-434)是一包平面欄位。
- **改法**:各 `stages/<id>.js` 加 `window.EVENTS` 三事件範本(Annex D 模式):
  - spin:`[{type:'TRCObjectEvent', bizStep:'receiving', label:'纖維到廠', labelEn:'Fibre receiving'},
    {type:'TRCTransformationEvent', bizStep:'spinning', label:'纖維→紗', labelEn:'Fibre into yarn'},
    {type:'TRCObjectEvent', bizStep:'despatching', label:'紗線出貨', labelEn:'Yarn despatch'}]`
  - weave:yarn receiving / yarn→fabric(Transformation)/ greige despatch
  - dye:fabric receiving / **dyeing+finishing 用 TRCObjectEvent**(Annex D:整理加工不改變識別,
    非 Transformation——demo 順帶演示這個 CWA 核心區別)/ finished fabric despatch
  - `doSign` 為每事件蓋 `eventId`(`STAGE.factoryId+'-EV-'+n`)與 `ts`,把 doc 欄位雜湊掛為
    `evidence`,存成 `submission.events`。
- **UI**:工廠「加密與送出」頁(vBoundary)加「本包裹含 3 事件」清單(型別 chip + bizStep + 證據雜湊)。

## B2. 事件掛上資產族譜:投入/產出批次與數量〔P1 / M〕(依賴 A2、B1)

- **法規**:`tracedobject.md` Table 21:`productIDandQty`「在事件內表示實際投入或產出的批次數量」。
  Annex A §A.3.2:轉換發生時**必須**能取回初始貨品批次(M-2-N)。Figure 6:Traceable asset
  「is input to」Event、Event「has output」Traceable asset。
- **現況**:無任何送件記錄消耗了哪個上游批次或數量;站間只有 mint 時的 token 指標。
- **改法**:`doSign` 用 `oget('submission:'+STAGE.prev)` 自動填轉換事件的
  `inputs:[{id: prev.tracedObject.lotId, qty}]` / `outputs:[{id: TRACED_OBJECT.lotId, qty}]`
  (spin 的 inputs 為空 = Annex D 的「batch creation」起點,或引用 A3 的原棉組成)。
- **UI**:平台各視圖顯示 Annex C 樣式的「made of」行:
  「LOT F-WEAVE$G-2207-08 · 1,180 m · made of F-SPIN$Y-2207-05」。demo 從此能回答
  「這匹布用了哪個紗批?」。

## B3. 平台新增「溯源報告」頁(TRCTRAReport)〔P1 / M〕(依賴 B1、B2;本計畫旗艦)

- **法規**:`data-model/trick-reports-and-events.md` §5.6.3.1:Traceability Report 是「任何標準化
  溯源資料流的核心」,兩種用途(完整歷史 / 增量更新),用於「公司之間、公司與 eService 平台之間」交換。
  結構:`annexes/annex-c-traceability-report.md` Figure C.1 —— 標頭旗標(primary item /
  limited by disclosure / exhaustive / accomplished production)+ 最終資產清單(LOT id、made of、數量)
  + 事件清單(Event ID、型別、bizStep、Where/Who/Why)。
- **現況**:無任何報告產物。`showDppJson`(platform.html:805-811)無事件無歷史;Notifications 是
  12 筆暫態字串。
- **改法**:平台 NAV 加「溯源報告 / Traceability Report」項,`buildTraceReport()` 從送件聚合:
  - 標頭旗標:`{primaryItem:true, limitedByDisclosure: priCount>0, exhaustiveInformation:false,
    accomplishedProduction: minted().length>=3}`
  - 最終資產清單:各站 `tracedObject`(B2 族譜串起)
  - 依時間合併的事件清單(Figure C.1 樣式行:Event ID / 型別 / bizStep / Where=廠牌+廠區 /
    Who=factoryId+DID / Why=訂單號)
  - 「Report JSON」modal 輸出 TRCTRAReport 形狀文件,**隨每站 mint 增量演進**——直接演示 CWA 的
    兩種報告用途。
- **UI**:每張訂單多一頁稽核者/買家 demo 的旗艦畫面。

## B4. 區塊鏈瀏覽器改講 EPCIS 5-W〔P2 / S〕(依賴 B1)

- **法規**:`annexes/annex-e-standardization-baseline.md` §E.3:每個加工/移轉點的 EPCIS 事件回答
  WHAT(批次唯一 ID)/ WHEN / WHERE / WHO(夥伴+廠區)/ WHY(訂單/契約)。
- **現況**:vChainExplorer(platform.html:486-516)只render帳本 metadata(token、tx、雜湊、時間)
  ——是 token 檢視器,不是事件鏈檢視器。
- **改法**:每張 `.blk` 卡下方掛該站 `submission.events` 摺疊列,格式化為 5-W:
  「[TRCTransformationEvent] 纖維→紗 — WHAT F-SPIN$Y-2207-05 (250 kg) · WHEN 2026-06-21 09:40 ·
  WHERE Prosperity Spinning Mill · WHO did:web:spin-factory.example · WHY order #A2207」。
  「串鏈與驗證」說明卡改寫:每個區塊錨定該站事件清單,並經投入批次+previousTokenId 連上前站資產。

## B5. 呈現廠際移轉:送出=出貨事件,下游一鍵「確認收料」〔P2 / M〕(依賴 B1)

- **法規**:§5.3.5.5 公司間物流移轉必記事件;`trick-reports-and-events.md` §5.6.3.5.1:
  TRCDesAdvise / TRCRecAdvise(增強型出貨/收貨通知,含起訖、貨品清單、附運輸文件);Annex D
  將 Spinner 的「yarn sending」與 Fabric producer 的「yarn receiving」配對。
- **現況**:工廠彼此完全隔離,織布站從不確認收到紡紗站的產出;交接只是 vBoundary 一行
  「prev-stage ref: spin」文字。
- **改法**:非首站且前站已 mint 時,工廠首頁/收件匣顯示「確認收料」卡(列上游批號+數量,讀自
  `oget('submission:'+STAGE.prev)`);一鍵寫 `order:<id>:transfer:<stage>` =
  `{recEvent:{type:'TRCObjectEvent', bizStep:'receiving', batch, qty, ts},
  despatchAdviceHash:simpleHash(batch+ts)}` 並預填本站收料事件。上游出貨事件由 doSign 自動產(B1)。
  **注意**:新鍵 `transfer:<stage>` 要加進 platform.html `orderKeys()`(級聯刪除)。
- **UI**:溯源報告與瀏覽器出現成對的出貨/收貨事件——目前 demo 最明顯缺席的 CWA 事件類別。

## B6. 事件與資產錨進 NFT metadata〔P2 / S〕(依賴 B1、B2)

- **法規**:Table 46 溯源群含 `<TRCEventList>`;Annex A §A.3.4:證據(檔案或其雜湊)上鏈以證明
  存在性、完整性、一致性。
- **現況**:`buildStageMetadata`(platform.html:170-187)只放揭露欄位——鏈上錨定證明不了
  「發生過什麼」。
- **改法**:`buildStageMetadata` 加 `dpp.tracedAsset` 與 `dpp.events`(證據只放雜湊)再做
  canonicalize,讓 keccak256 metadataHash 與 IPFS tokenURI 覆蓋事件清單;工廠 `doSign` 的模擬
  metadataHash 輸入也串 `JSON.stringify(events)`,`verifyChain` 重算才一致。瀏覽器區塊卡加
  eventListHash 一行。
- **UI**:打開真實區塊的 tokenURI 能看到事件與資產;說明卡可如實寫「本區塊公證本站事件歷史」。

## B7. 轉換事件掛製程作業代碼〔P3 / S〕= 計畫 1 §A4 的事件側應用

A4 落地後,把 `opCode` chip(JetBrains Mono)render 在事件列旁:「TRCTransformationEvent · op 1.4.1
Mechanical Spinning」。同樣注意:weave/dye 代碼標示為示意。

---

## 實作順序與驗證

1. B1 → B2(一起做,`submission.events` 一次成形)→ 手測:三站依序送件,檢查每站事件的
   inputs 指向前站 lotId。
2. B3 溯源報告頁(旗艦,值得一次獨立 PR + 截圖)→ 雙語走查 + `orderKeys()` 檢查。
3. B4、B6 小改;B5 涉及新 bus 鍵與工廠 UI 流程,單獨做。
4. 回歸:模擬上鏈路徑 `verifyChain` 必須仍然全綠(B6 改了雜湊輸入,工廠與平台要同步改)。
