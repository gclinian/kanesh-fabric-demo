/* stages/weave.js — weave 站設定(唯一各廠差異)。改本站欄位/顏色只動這裡。 */
window.STAGE = {
  id:'weave', factoryId:'F-WEAVE', order:1, prev:'spin',
  label:'織布', role:'織布 weave',
  brand:'🧶 Harmony 織布廠',
  titleZh:'織布廠 Endpoint · 互動原型',
  color:'#9333ea',
  orderNo:'#A2207',
};
window.FIELDS = [
  {id:'loom',   key:'loomId',       grp:'機台 / 製程', label:'織機 ID',              val:'AJL-23',               kind:'data', sensitive:false, rec:'private'},
  {id:'wparam', key:'weaveParam',   grp:'機台 / 製程', label:'上機參數 經/緯密 · 車速', val:'128×72 根/吋 · 650 rpm', kind:'data', sensitive:true,  rec:'private'},
  {id:'gbatch', key:'greigeBatch',  grp:'批次 / 料號', label:'胚布批號 greige',       val:'G-2207-08',            kind:'data', sensitive:false, rec:'public'},
  {id:'struct', key:'structure',    grp:'批次 / 料號', label:'組織 structure',        val:'平紋 plain',           kind:'data', sensitive:false, rec:'public'},
  {id:'width',  key:'width',        grp:'規格',        label:'幅寬 width',           val:'58 inch',              kind:'data', sensitive:false, rec:'public'},
  {id:'gsm',    key:'gsm',          grp:'規格',        label:'克重 GSM',             val:'145 g/m²',             kind:'data', sensitive:false, rec:'public'},
  {id:'dens',   key:'density',      grp:'測試 / 品質', label:'經緯密度 density',      val:'128 × 72',             kind:'data', sensitive:false, rec:'public'},
  {id:'tear',   key:'strength',     grp:'測試 / 品質', label:'撕裂強度 tear',         val:'1,820 g',              kind:'data', sensitive:false, rec:'public'},
  {id:'defect', key:'defectRate',   grp:'測試 / 品質', label:'疵點率 defect',         val:'2.1 %',                kind:'data', sensitive:false, rec:'public'},
  {id:'greport',key:'greigeReport', grp:'文件',        label:'胚布檢驗報告.pdf',       val:'hash 5b9d… (只存雜湊)', kind:'doc',  sensitive:false, rec:'public'},
];
