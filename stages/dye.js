/* stages/dye.js — dye 站設定(唯一各廠差異)。改本站欄位/顏色只動這裡。 */
window.STAGE = {
  id:'dye', factoryId:'F-DYE', order:2, prev:'weave',
  label:'染整', role:'染整 dye-fnsh',
  brand:'🏭 Evergreen 染整廠',
  titleZh:'染整廠 Endpoint · 互動原型',
  color:'#4338ca',
  orderNo:'#A2207',
};
window.FIELDS = [
  {id:'machine', key:'machineId',   grp:'機台 / 製程', label:'染色機 ID',              val:'DYE-07',                    kind:'data', sensitive:false, rec:'private'},
  {id:'stenter', key:'stenterParam',grp:'機台 / 製程', label:'定型溫度 / 車速',         val:'195°C / 22 m·min',          kind:'data', sensitive:true,  rec:'private'},
  {id:'batch',   key:'batch',       grp:'批次 / 料號', label:'染色批號 batch',          val:'B-2207-13',                 kind:'data', sensitive:false, rec:'public'},
  {id:'recipe',  key:'recipe',      grp:'批次 / 料號', label:'染料配方 recipe',         val:'CI Acid Blue 25 · 2.1%owf …', kind:'data', sensitive:true,  rec:'private'},
  {id:'deltaE',  key:'deltaE',      grp:'測試 / 品質', label:'色差 ΔE',                val:'0.82',                      kind:'data', sensitive:false, rec:'public'},
  {id:'fast',    key:'fastness',    grp:'測試 / 品質', label:'堅牢度 fastness (ISO 105)',val:'摩擦 4-5 級',                kind:'data', sensitive:false, rec:'public'},
  {id:'cod',     key:'cod',         grp:'測試 / 品質', label:'廢水 COD',               val:'180 mg/L',                  kind:'data', sensitive:false, rec:'public'},
  {id:'report',  key:'testReport',  grp:'文件',        label:'測試報告.pdf',            val:'hash 3af9… (只存雜湊)',      kind:'doc',  sensitive:false, rec:'public'},
  {id:'grs',     key:'grsCert',     grp:'文件',        label:'GRS 交易證明.pdf',        val:'hash b1c7… (只存雜湊)',      kind:'doc',  sensitive:true,  rec:'private'},
];
