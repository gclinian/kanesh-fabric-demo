/* stages/spin.js — spin 站設定(唯一各廠差異)。改本站欄位/顏色只動這裡。
   En 欄位供中英切換:labelEn(欄位英文名)、valEn(值含中文時的英文);純數字/單位的值不需 valEn。 */
window.STAGE = {
  id:'spin', factoryId:'F-SPIN', order:0, prev:null,
  label:'紡紗', role:'紡紗 spin',
  labelEn:'Spinning', roleEn:'Spinning (spin)',
  brand:'Prosperity 紡紗廠', brandEn:'Prosperity Spinning Mill',
  titleZh:'紡紗廠 Endpoint · 互動原型', titleEn:'Spinning Mill Endpoint · Prototype',
  color:'#0E4F4A',           // 角色色(頂欄上緣)
  orderNo:'#A2207',
};
window.FIELDS = [
  {id:'spindle', key:'spindleId',  grp:'機台 / 製程', label:'紡紗機 ID',          labelEn:'Spinning Machine ID', val:'RING-12',            kind:'data', sensitive:false, rec:'private'},
  {id:'spinp',   key:'spinParam',  grp:'機台 / 製程', label:'捻度 / 錠速',         labelEn:'Twist / Spindle Speed', val:'720 T/m · 16,000 rpm',kind:'data', sensitive:true,  rec:'private'},
  {id:'count',   key:'yarnCount',  grp:'批次 / 料號', label:'紗支號數 yarn count', labelEn:'Yarn Count', val:'Ne 40/1',            kind:'data', sensitive:false, rec:'public'},
  {id:'blend',   key:'blend',      grp:'批次 / 料號', label:'混紡比 blend',        labelEn:'Blend Ratio', val:'精梳棉 100%',         valEn:'Combed cotton 100%', kind:'data', sensitive:false, rec:'public'},
  {id:'cv',      key:'evenness',   grp:'測試 / 品質', label:'條乾 CV%',            labelEn:'Evenness CV%', val:'12.4 %',             kind:'data', sensitive:false, rec:'public'},
  {id:'ten',     key:'tenacity',   grp:'測試 / 品質', label:'強力 tenacity',       labelEn:'Tenacity', val:'18.6 cN/tex',        kind:'data', sensitive:false, rec:'public'},
  {id:'hair',    key:'hairiness',  grp:'測試 / 品質', label:'毛羽 hairiness (H)',  labelEn:'Hairiness (H)', val:'4.2',                kind:'data', sensitive:false, rec:'public'},
  {id:'yreport', key:'yarnReport', grp:'文件',        label:'紗線測試報告.pdf',     labelEn:'Yarn Test Report.pdf', val:'hash 71a0… (只存雜湊)', valEn:'hash 71a0… (hash only)', kind:'doc',  sensitive:false, rec:'public'},
  {id:'ocs',     key:'ocsCert',    grp:'文件',        label:'OCS 有機棉證明.pdf',   labelEn:'OCS Organic Cotton Cert.pdf', val:'hash c4e2… (只存雜湊)', valEn:'hash c4e2… (hash only)', kind:'doc',  sensitive:true,  rec:'private'},
];
