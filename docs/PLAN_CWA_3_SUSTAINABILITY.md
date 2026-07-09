# 計畫 3 — 永續資料(Bill of X / 指標宣告)

> 索引:[CWA_ALIGNMENT_OVERVIEW.md](CWA_ALIGNMENT_OVERVIEW.md)
> 主軸:目前三站欄位幾乎全是製程/品質值(機台、支數、GSM、ΔE),整個 app 只有一個環境量化數據
> (dye 的廢水 COD,還被歸在「測試/品質」)。CWA 的永續層是兩層式:**機密的量化盤查(Bill of X)**
> + **可公開的摘要指標(sustainabilityIndicator)**。Table 43 把能源(h)/水(i)/資源(j)/化學品(g)/
> 再生含量(k) 全評 High——「由供應鏈各階段提供量化聲明」。
> 驗證狀態:◐(Table 34/43/Table 6、§5.4 已由主 session 讀原文核實;現況行號已抽查)。

## C1. 三站補「Bill of X」量化欄位(能源/水/化學品/廢棄物/廢水/排放)〔P1 / M〕

- **法規**:`data-model/sustainabilitycharacteristics.md`(5.6.2.11, Table 34)——
  `<productSustainabilityCharacteristics>` 子元素:billOfTreatments / billOfMaterials / billOfChemical /
  billOfUsedWater / billOfEnergy / billOfWaste / billOfWasteWater / billOfDirectEmissions /
  internalWasteWaterTreatmentPlant,全部相對 `productReferenceQty`(參考產品量)。
  `sections/12` Table 43:(h) 能源、(i) 水、(j) 資源 High——「提供各階段貢獻的量化聲明;
  用二手資料不獎勵優良供應鏈」。`sections/10` §5.4.3 Table 6 各 bill 在 PRODUCT 層打 x。
- **現況**:stages/*.js 三站 FIELDS(鏡像 platform.html SPIN/WEAVE/DYE_FIELDS)只有製程/品質值;
  唯一環境數據 `cod`(stages/dye.js:19)歸錯組;單位埋在顯示字串、無參考量。
- **改法**:FIELDS schema 加三個屬性:`cwa:'billOfEnergy'|'billOfUsedWater'|…`、`unit`、`refQty`。
  示範欄位(公開/加密建議值照列):
  - **spin**:energyUse「3,850 kWh」refQty「每 1,000 kg 紗」(billOfEnergy, 公開)、
    energyMix「32% 再生能源(廠內光電)」(billOfEnergy, 公開)、
    fibreWaste「85 kg 精梳落棉 · 售予回收」(billOfWaste, 公開)
  - **weave**:energyUse「2,100 kWh / 10,000 m 坯布」(billOfEnergy, 公開)、
    sizingAgent「PVA 漿料 48 kg / 10,000 m」(billOfChemical, 預設加密)、
    selvageWaste「120 kg 紗/布邊廢料」(billOfWaste, 公開)
  - **dye**:waterUse「65 L/kg 布 · 井水」(billOfUsedWater, 公開;水種代碼 NT318 為必填,
    標注 ground water)、wasteWater「58 L/kg 排放」(billOfWasteWater, 公開;**現有 cod 移入此組**)、
    thermalEnergy「9.5 MJ 蒸汽 + 2.4 kWh /kg」(billOfEnergy, 公開)、
    directEmissions「0.42 kg CO2e/kg(瓦斯鍋爐)」(billOfDirectEmissions, 公開)、
    wwtp「廠內廢水處理設施 · 僅服務染色段」(internalWasteWaterTreatmentPlant, 公開)
  - 新組標題走現有 GRP_EN 映射,如「永續盤查 · 能源 / Sustainability · Energy (billOfEnergy)」。
- **UI**:工廠揭露工作台自動多出各 bill 組;政策建構器勾選表自動帶入(它迭代 stage.fields);
  DPP 與 vBoundary 顯示帶單位+參考量的量化環境數據。

## C2. DPP 護照加「productSustainabilityCharacteristics」跨站彙整區塊〔P1 / M〕(依賴 C1)

- **法規**:Table 46 生態設計群 = 各 BillOf* + Product/FacilitySustainabilityCharacteristics +
  sustainabilityIndicatorGroup。`sections/06` §4.2:單品能耗「必須考慮供應鏈不同製造商各階段的貢獻
  (染整、紡紗等的能源、水數據都要納入)」。
- **現況**:`dppPreview()`(platform.html:524-589)一廠一欄平面列表;無跨站視圖、無彙總;
  COD 夾在 ΔE 和牢度之間毫無辨識度。
- **改法**:保留現有一廠一欄(溯源用),下方新增護照第二區
  「產品永續特性 · <productSustainabilityCharacteristics>」:按 `cwa` 標籤 pivot——每種 bill 一個
  子面板(mono 小標籤顯示 CWA 元素名),列各站貢獻(站名 + 值 + refQty);單位可加總者
  (kWh、L、kg CO2e)加「已申報階段合計」列,注記未申報階段使合計非窮盡(呼應
  @exhaustiveInformation)。`showDppJson()` 增輸出 `productSustainabilityCharacteristics` 物件。
  純加法 ~100 行。
- **UI**:消費者/法規雙視角都看得到永續區塊——觀眾能回答「這件 POLO 衫各階段和總共用了多少能源/水」,
  正是 Table 43 (h)/(i) 要供應鏈回答的問題。

## C3. 計算指標層:指標宣告卡(sustainabilityIndicatorsGroup)〔P1 / M〕(依賴 C1)

- **法規**:`sustainabilityindicatorsgroup.md`(5.6.2.14)—— 必填 groupName + methodology,
  「同組值須出自同一方法論(如 PEF 影響類別、SA8000)」;`sustainabilityindicator.md`(5.6.2.13)
  每指標帶 issuer/reviewer/必填 `@indicatorStatusCode`。`sections/10` §5.4.1:need-to-know——
  「各方之間只分享摘要指標(indicators declarations)」。另見 §5.6.3.5.2 `<SRVIndicatorsDeclaration>`:
  「分享評估結果而不揭露機密部分,但保證其存在與不可變」。
- **現況**:全 app 無指標概念,平台只發布原始欄位值;無法展示 CWA 的兩層設計(機密盤查 vs 公開指標)。
- **改法**:三站 mint 完成後,vDPP 出現「發布指標宣告」動作,從 bill 欄位算一組 demo 指標,
  `oset('indicators', {...})` 存 `order:<id>:indicators`(**記得加進 orderKeys()**):
  `{ groupName:'環境足跡篩查 (demo)', methodology:'PEF-like screening v1 (demo)', indicators:[
  {name:'Climate change', value:'2.1', unit:'kg CO2e / item', validationMethod:'estimated', status:'issued'},
  {name:'Water use', value:'38', unit:'L / item', validationMethod:'measured', status:'issued'},
  {name:'Energy', value:'14.2', unit:'MJ / item', validationMethod:'measured', status:'issued'}],
  issuer:'LongAdvance Platform (Expert)', ts }`。護照**雙視角**render宣告卡(指標本來就是公開層)+
  JSON modal 仿 `<SRVIndicatorsDeclaration>`(指標 + 機密研究的雜湊參照)。
- **UI**:消費者看到摘要指標卡,原始加密盤查仍走金鑰申請——消費者/法規切換從此**精確演示**
  CWA 的「指標公開、盤查 need-to-know」分層。

## C4. 永續欄位加資料品質旗標(@validationMethod)〔P2 / S〕

- **法規**:`sustainabilityindicator.md` Table 39:`@validationMethod`——「現場量測 / 間接估算 /
  專家核可 / 文獻值,選填但建議」。§5.4.1:「特別注意資料品質(primary vs secondary、
  measured vs estimated)」;Table 43 說二手資料「不獎勵優良供應鏈」。
- **現況**:送件無品質 metadata;法規機關無從分辨「65 L/kg」是現場計量還是抄文獻。
- **改法**:C1 欄位加 `method:'measured'|'estimated'|'literature'`(dye waterUse=measured 流量計;
  spin energyMix=estimated;weave sizingAgent=literature)。vDisclose 與 dppPreview 各render小 chip:
  `t('現場量測','Measured on-site')` 等。進 doSign 映射與 buildStageMetadata。~30 行。

## C5. 廠區層年度永續檔案(facilitySustainabilityCharacteristics)〔P2 / M〕(依賴計畫 1 A1)

- **法規**:Table 35:廠區版各 bill 為「**年度**消耗量」;5.6.2.11 本文:「廠區資料是產品層的子集,
  按年彙總」。`facilitydescriptor.md` 另有 `facilityYearlyProductionMass`。Table 6 FACILITY 列。
- **現況**:app 無廠區層;所有值都隱含是本訂單的產品資料——CWA 的「批次量 vs 年度彙總」區別無法展示。
- **改法**:各 `stages/<id>.js` 加 `window.FACILITY = { year:2025, yearlyProductionMass:'4,200 t 紗',
  annual:{energy:'8.2 GWh', water:'120,000 m³'(dye 才有意義), waste:'310 t', wastewater:'95,000 m³'},
  wwtp:true|false }`(位置資訊併入 A1 的 facility)。工廠 Settings render唯讀
  「廠區永續檔案 · 2025 年度」卡;doSign 附 `facilitySustainability` 區塊;平台 dppPreview
  **僅法規視角**顯示(Table 45:屬盡職調查/稽核素材,非消費者內容)。
- **UI**:法規視角能對照講「這個數字是本訂單每 1,000 kg;那個是該廠 2025 全年」。

## C6. 染料配方升級為 billOfChemical + 公開 SVHC 聲明〔P2 / S〕

- **法規**:Table 43 (g)「substances of concern」High;`bill-of-something.md`:billOfChemical 有專屬
  `<dyesDescriptor>`/`<chemicalItem>`;Annex A Table A.5 將 Bill of chemical 同時用於 PEF 與健康保護服務。
- **現況**:化學只有一個自由文字商業機密欄 `recipe`(stages/dye.js:16),歸在「批次/料號」;
  無助劑清單;護照對化學安全**隻字未提**,除非法規機關拿到整份秘方。
- **改法**:stages/dye.js(鏡像 platform 副本):(1) recipe 移入新組「化學品盤查 (billOfChemical)」
  維持加密;(2) 加 auxChemicals(加密,「勻染劑 0.8 g/L · 純鹼 12 g/L · 醋酸 1.2 g/L」)= chemicalItem
  清單;(3) 加 **svhcStatement(公開)**:「無 REACH SVHC >0.1% w/w · 符合 ZDHC MRSL v3.1」。
  ——need-to-know 模式的縮影:量化盤查加密、符合性聲明公開。
- **UI**:消費者護照 dye 站多「substances of concern」行;vKeys 從此有真正有意義的密文
  (完整化學盤查)供法規流程演示。

## C7. 再生含量 + 生命終端表現(circularity 收尾)〔P3 / S〕

- **法規**:Table 43 (k) recycled content High;Table 34 `endOfLifePerformance`
  (「產品壽命終點預期的再利用/回收/堆肥資訊」)、`billOfMaterials`。
- **現況**:spin 有 blend「精梳棉 100%」與 OCS 證雜湊、dye 有 GRS 證雜湊——但**沒有任何數字化
  再生含量**,護照也沒說產品壽命終點該怎麼處理;GRS 證書變成沒有主張支撐的孤兒證據。
- **改法**:stages/spin.js 加 recycledContent(公開,cwa:'billOfMaterials',
  「再生棉 20% (GRS) · 有機棉 80% (OCS)」,blend 同步改)——讓既有 OCS/GRS 雜湊繫到量化主張;
  平台 dppPreview 護照標頭加靜態 endOfLife 行:「單一材質棉針織 · 適合纖維機械回收」
  (標注 `<endOfLifePerformance>`,雙視角可見)。
- **UI**:分揀/回收業者掃 QR 想找的兩個 circularity 數據點。

---

## 實作順序與驗證

1. C1(欄位地基;**注意 stages/*.js 與 platform.html 的欄位副本必須同步改**,這是已知的重複來源)
   → 政策建構器、揭露工作台自動長出新組,雙語走查。
2. C2 → C3(護照兩層呈現;C3 記得 `orderKeys()` 加 `indicators`,重置訂單要清掉)。
3. C4/C6/C7 小項穿插;C5 依賴 A1 的 facility。
4. 回歸:欄位變多後,政策「全選」路徑與 `exhaustiveInformation`(計畫 1 A7)的計算要重驗。
