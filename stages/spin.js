/* stages/spin.js — spin 站設定(唯一各廠差異)。改本站欄位/顏色只動這裡。 */
window.STAGE = {
  id:'spin', factoryId:'F-SPIN', order:0, prev:null,
  label:'紡紗', role:'紡紗 spin',
  brand:'🧵 Prosperity 紡紗廠',
  titleZh:'紡紗廠 Endpoint · 互動原型',
  color:'#0d9488',           // 角色色(頂欄上緣)
  orderNo:'#A2207',
};
window.FIELDS = [
  {id:'spindle', key:'spindleId',  grp:'機台 / 製程', label:'紡紗機 ID',          val:'RING-12',            kind:'data', sensitive:false, rec:'private'},
  {id:'spinp',   key:'spinParam',  grp:'機台 / 製程', label:'捻度 / 錠速',         val:'720 T/m · 16,000 rpm',kind:'data', sensitive:true,  rec:'private'},
  {id:'count',   key:'yarnCount',  grp:'批次 / 料號', label:'紗支號數 yarn count', val:'Ne 40/1',            kind:'data', sensitive:false, rec:'public'},
  {id:'blend',   key:'blend',      grp:'批次 / 料號', label:'混紡比 blend',        val:'精梳棉 100%',         kind:'data', sensitive:false, rec:'public'},
  {id:'cv',      key:'evenness',   grp:'測試 / 品質', label:'條乾 CV%',            val:'12.4 %',             kind:'data', sensitive:false, rec:'public'},
  {id:'ten',     key:'tenacity',   grp:'測試 / 品質', label:'強力 tenacity',       val:'18.6 cN/tex',        kind:'data', sensitive:false, rec:'public'},
  {id:'hair',    key:'hairiness',  grp:'測試 / 品質', label:'毛羽 hairiness (H)',  val:'4.2',                kind:'data', sensitive:false, rec:'public'},
  {id:'yreport', key:'yarnReport', grp:'文件',        label:'紗線測試報告.pdf',     val:'hash 71a0… (只存雜湊)',kind:'doc',  sensitive:false, rec:'public'},
  {id:'ocs',     key:'ocsCert',    grp:'文件',        label:'OCS 有機棉證明.pdf',   val:'hash c4e2… (只存雜湊)',kind:'doc',  sensitive:true,  rec:'private'},
];
