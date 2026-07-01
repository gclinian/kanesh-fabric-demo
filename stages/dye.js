/* stages/dye.js — dye 站設定(唯一各廠差異)。改本站欄位/顏色只動這裡。
   En 欄位供中英切換:labelEn、valEn(值含中文時的英文)。 */
window.STAGE = {
  id:'dye', factoryId:'F-DYE', order:2, prev:'weave',
  label:'染整', role:'染整 dye-fnsh',
  labelEn:'Dyeing', roleEn:'Dyeing (dye-fnsh)',
  brand:'🏭 Evergreen 染整廠', brandEn:'🏭 Evergreen Dyeing Mill',
  titleZh:'染整廠 Endpoint · 互動原型', titleEn:'Dyeing Mill Endpoint · Prototype',
  color:'#4338ca',
  orderNo:'#A2207',
};
window.FIELDS = [
  {id:'machine', key:'machineId',   grp:'機台 / 製程', label:'染色機 ID',              labelEn:'Dyeing Machine ID', val:'DYE-07',                    kind:'data', sensitive:false, rec:'private'},
  {id:'stenter', key:'stenterParam',grp:'機台 / 製程', label:'定型溫度 / 車速',         labelEn:'Setting Temp / Speed', val:'195°C / 22 m·min',          kind:'data', sensitive:true,  rec:'private'},
  {id:'batch',   key:'batch',       grp:'批次 / 料號', label:'染色批號 batch',          labelEn:'Dye Batch No.', val:'B-2207-13',                 kind:'data', sensitive:false, rec:'public'},
  {id:'recipe',  key:'recipe',      grp:'批次 / 料號', label:'染料配方 recipe',         labelEn:'Dye Recipe', val:'CI Acid Blue 25 · 2.1%owf …', kind:'data', sensitive:true,  rec:'private'},
  {id:'deltaE',  key:'deltaE',      grp:'測試 / 品質', label:'色差 ΔE',                labelEn:'Color Diff ΔE', val:'0.82',                      kind:'data', sensitive:false, rec:'public'},
  {id:'fast',    key:'fastness',    grp:'測試 / 品質', label:'堅牢度 fastness (ISO 105)',labelEn:'Fastness (ISO 105)', val:'摩擦 4-5 級',                valEn:'Rubbing grade 4-5', kind:'data', sensitive:false, rec:'public'},
  {id:'cod',     key:'cod',         grp:'測試 / 品質', label:'廢水 COD',               labelEn:'Wastewater COD', val:'180 mg/L',                  kind:'data', sensitive:false, rec:'public'},
  {id:'report',  key:'testReport',  grp:'文件',        label:'測試報告.pdf',            labelEn:'Test Report.pdf', val:'hash 3af9… (只存雜湊)',      valEn:'hash 3af9… (hash only)', kind:'doc',  sensitive:false, rec:'public'},
  {id:'grs',     key:'grsCert',     grp:'文件',        label:'GRS 交易證明.pdf',        labelEn:'GRS Transaction Cert.pdf', val:'hash b1c7… (只存雜湊)',      valEn:'hash b1c7… (hash only)', kind:'doc',  sensitive:true,  rec:'private'},
];
