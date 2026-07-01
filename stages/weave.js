/* stages/weave.js — weave 站設定(唯一各廠差異)。改本站欄位/顏色只動這裡。
   En 欄位供中英切換:labelEn、valEn(值含中文時的英文)。 */
window.STAGE = {
  id:'weave', factoryId:'F-WEAVE', order:1, prev:'spin',
  label:'織布', role:'織布 weave',
  labelEn:'Weaving', roleEn:'Weaving (weave)',
  brand:'🧶 Harmony 織布廠', brandEn:'🧶 Harmony Weaving Mill',
  titleZh:'織布廠 Endpoint · 互動原型', titleEn:'Weaving Mill Endpoint · Prototype',
  color:'#9333ea',
  orderNo:'#A2207',
};
window.FIELDS = [
  {id:'loom',   key:'loomId',       grp:'機台 / 製程', label:'織機 ID',              labelEn:'Loom ID', val:'AJL-23',               kind:'data', sensitive:false, rec:'private'},
  {id:'wparam', key:'weaveParam',   grp:'機台 / 製程', label:'上機參數 經/緯密 · 車速', labelEn:'Setup: Warp/Weft Density · Speed', val:'128×72 根/吋 · 650 rpm', valEn:'128×72 /inch · 650 rpm', kind:'data', sensitive:true,  rec:'private'},
  {id:'gbatch', key:'greigeBatch',  grp:'批次 / 料號', label:'胚布批號 greige',       labelEn:'Greige Batch No.', val:'G-2207-08',            kind:'data', sensitive:false, rec:'public'},
  {id:'struct', key:'structure',    grp:'批次 / 料號', label:'組織 structure',        labelEn:'Structure', val:'平紋 plain',           valEn:'Plain', kind:'data', sensitive:false, rec:'public'},
  {id:'width',  key:'width',        grp:'規格',        label:'幅寬 width',           labelEn:'Width', val:'58 inch',              kind:'data', sensitive:false, rec:'public'},
  {id:'gsm',    key:'gsm',          grp:'規格',        label:'克重 GSM',             labelEn:'GSM (Weight)', val:'145 g/m²',             kind:'data', sensitive:false, rec:'public'},
  {id:'dens',   key:'density',      grp:'測試 / 品質', label:'經緯密度 density',      labelEn:'Thread Density', val:'128 × 72',             kind:'data', sensitive:false, rec:'public'},
  {id:'tear',   key:'strength',     grp:'測試 / 品質', label:'撕裂強度 tear',         labelEn:'Tear Strength', val:'1,820 g',              kind:'data', sensitive:false, rec:'public'},
  {id:'defect', key:'defectRate',   grp:'測試 / 品質', label:'疵點率 defect',         labelEn:'Defect Rate', val:'2.1 %',                kind:'data', sensitive:false, rec:'public'},
  {id:'greport',key:'greigeReport', grp:'文件',        label:'胚布檢驗報告.pdf',       labelEn:'Greige Inspection Report.pdf', val:'hash 5b9d… (只存雜湊)', valEn:'hash 5b9d… (hash only)', kind:'doc',  sensitive:false, rec:'public'},
];
