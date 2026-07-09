# CWA 18291 對齊總覽 — 前端與功能改進計畫索引

> 依據:`docs/cwa18291-reference/`(CWA 18291:2025「TRICK — 紡織供應鏈 DPP 資料收集指引」LLM 易讀版知識庫)。
> 產出方式:多代理差距分析(4 個法規/程式讀取代理 → 5 個主題分析代理 → 對抗式引用驗證代理),
> 共 37 條差距,收斂為 5 份計畫、31 個工作項。
> 每一項都附「法規依據(檔案+條款)/現況(檔案+行號)/改法/工作量/優先級」。

## 五份計畫

| # | 文件 | 主題 | 一句話 |
|---|---|---|---|
| 1 | [PLAN_CWA_1_DATA_MODEL.md](PLAN_CWA_1_DATA_MODEL.md) | 資料模型與識別 | 讓每站的送件對得上 TRICK 元素:組織/廠區身分、批號 tracedObject、billOfComponents、processStep、結構化證書、TRCProduct 形狀的 DPP JSON |
| 2 | [PLAN_CWA_2_TRACEABILITY_EVENTS.md](PLAN_CWA_2_TRACEABILITY_EVENTS.md) | 事件式溯源 | CWA 是事件模型:收料→轉換→出貨三事件、批次族譜、溯源報告(TRCTRAReport)頁、區塊瀏覽器改講 5-W |
| 3 | [PLAN_CWA_3_SUSTAINABILITY.md](PLAN_CWA_3_SUSTAINABILITY.md) | 永續資料 | 三站補 Bill of X(能源/水/化學品/廢棄物)量化欄位、DPP 永續區塊、指標宣告(sustainabilityIndicatorsGroup) |
| 4 | [PLAN_CWA_4_DISCLOSURE_DPP.md](PLAN_CWA_4_DISCLOSURE_DPP.md) | 揭露分級與 DPP 呈現 | 護照改成 DPP 三大資訊群、五級 @disclosureLevel、單一 GS1 Digital Link QR、**修一個真 bug**(法規視角明文來源) |
| 5 | [PLAN_CWA_5_WORKFLOW_UX.md](PLAN_CWA_5_WORKFLOW_UX.md) | 工作流與方法論 UX | 用 CWA 五步驟法包裝現有流程:Step 2 供應鏈地圖頁、Step 1 目標/主張、供應商啟用握手、CWA 術語 |

## 評估結論(TL;DR)

現在的 demo 把「政策派發 → 公開/加密決策 → 上鏈 → DPP+QR」跑得很順,但用的是**自創詞彙和自創資料形狀**,
和 CWA 18291 幾乎對不上任何一個具名元素。對懂法規的觀眾,最便宜、最有感的三個升級:

1. **資料形狀改叫 CWA 的名字**(計畫 1)——送件裡放 `organisation`/`facility`/`tracedObject`/
   `billOfComponents`,DPP JSON 輸出改成 `TRCProduct` 形狀。多半是「加欄位+改標籤」,S~M 工作量。
2. **補上事件層**(計畫 2)——CWA 的核心是 Event(§5.3.6.1 Figure 6:Event 是中心實體)。
   每站產「收料/轉換/出貨」三事件 + 批次族譜,再給平台一頁 Annex C 樣式的溯源報告。這是 demo 從
   「NFT 鏈」升級成「溯源系統」的關鍵。
3. **DPP 護照改成三大資訊群**(計畫 4)——ESPR 的三群(生態設計/識別/溯源,Table 46)取代
   「一廠一欄」排版,加上五級揭露詞彙,讓護照頁直接可以對照法規講解。

另外發現 **1 個真正的實作矛盾**(已驗證,見計畫 4 §D4):法規機關視角「已放行解密」的值,
其實是平台從自己的欄位目錄查出來的(`catVal`,platform.html:541),而工廠 `doSign` 明明送 `val:null`
——與 demo 自己宣稱的「平台讀不到加密欄位」矛盾。應改為放行時由工廠端寫回。

## 建議實作順序(跨計畫依賴)

```
第一波(地基,全部 S):
  1-A1 組織/廠區身分     1-A2 tracedObject 批號     1-A6 產品識別(GTIN+貨號)
第二波(靠地基):
  1-A3 billOfComponents(要 A2)      2-B1/B2 事件+族譜(要 A2)
  4-D1 三大資訊群護照                 4-D4 放行值來源修正(獨立,隨時可做)
第三波(講故事):
  2-B3 溯源報告頁(要 B1/B2)          3-C1 Bill of X 欄位 → 3-C2 永續區塊
  4-D2 五級揭露                       5-E1 供應鏈地圖頁
第四波(潤飾):
  1-A4/A5/A7、2-B4/B5/B6、3-C3~C7、4-D3/D5/D6、5-E2~E6
```

## 驗證狀態說明

- **✓ 已驗證**:對抗式驗證代理逐條打開引用檔核對條款原文 + 打開程式碼核對行號與現況(計畫 1、4 全部)。
- **◐ 已抽查**:驗證代理因 session 限額中斷(計畫 2、3、5),但其法規引用段落
  (§5.3.5.5、§5.6.3、Annex C/D、Table 43/46、§5.4)已由主 session 直接讀原文核實,
  程式現況宣稱(spin 無批號、dye recipe/cod 行號、二元揭露切換、QR `view=` 註解)已逐一 grep 抽查屬實。

## 共通實作約束(所有計畫都適用)

- 零建置靜態架構不變:改 `stages/*.js`、`assets/js/factory-app.js`、`platform.html`,localStorage bus。
- `factory-app.js` 是 classic top-level script,函式必須維持全域(inline `onclick`),勿包 IIFE。
- 訂單命名空間:新增的每筆資料都走 `oget/oset`(`order:<id>:...`),並把新鍵加進 `orderKeys()` 以支援級聯刪除。
- i18n:所有新字串 `${t('中文','English')}`;英文字串**不得含撇號**(會破壞跳脫,改寫法避開)。
- 視覺遵循 `DESIGN.md`(Industrial-Archival):CWA 元素名一律 JetBrains Mono 小標籤(mono chip),不用 emoji。
- 驗證手法:`node --check`(HTML 先抽出 inline script)、`npm run serve` + 瀏覽器雙語走查、括號/反引號配對檢查。
