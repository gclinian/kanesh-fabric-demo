/* factory-app.js — 三個工廠共用的應用邏輯(從原 factory-spin.html body 逐字抽出)。
 * 依賴 stages/<id>.js 先設定的全域 window.STAGE / window.FIELDS。
 * 注意:本檔為 classic top-level script,所有 function 須維持全域,
 *       因為畫面用內聯 onclick="go(...)" 等呼叫它們。請勿包進 IIFE/模組。
 * 要改三廠共用的介面邏輯:只改這一個檔。 */

FIELDS.forEach(f=>f.disclosure=f.rec);

/* ---------- 跨檔資料匯流排(同源 localStorage;file:// 失敗時自動降級為單機 mock) ---------- */
const Bus={
  ns:'dpp_demo:',
  get(k){try{const v=localStorage.getItem(this.ns+k);return v?JSON.parse(v):null;}catch(e){return null;}},
  set(k,v){try{localStorage.setItem(this.ns+k,JSON.stringify(v));}catch(e){}},
  del(k){try{localStorage.removeItem(this.ns+k);}catch(e){}},
  onChange(cb){window.addEventListener('storage',e=>{if(e.key&&e.key.indexOf(this.ns)===0){let v=null;try{v=e.newValue?JSON.parse(e.newValue):null;}catch(_){}cb(e.key.slice(this.ns.length),v);}});}
};
/* 內建範例政策(離線 / 平台尚未派發時使用,確保單機可完整展示) */
const MOCK_POLICY={ id:'POL-A2207', order:STAGE.orderNo, issuer:'LongAdvance 平台', retentionYears:10,
  deadline:'2026-06-25', sig:'verified ✓', perStage:{ [STAGE.id]: FIELDS.map(f=>f.key) } };

/* ---------- 工具 ---------- */
function simpleHash(str){let h=0x811c9dc5;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=(h*0x01000193)>>>0;}return ('00000000'+h.toString(16)).slice(-8);}
function nowUTC(){return new Date().toISOString().slice(0,16).replace('T',' ')+' UTC';}
const SC=[['poly','聚酯',null,'Polyester'],['spin','紡紗','spin','Spinning'],['weave','織布','weave','Weaving'],['dye','染整','dye','Dyeing'],['cmt','成衣',null,'Garment'],['DPP','護照',null,'Passport']];
const GRP_EN={'機台 / 製程':'Machine / Process','批次 / 料號':'Batch / SKU','測試 / 品質':'Testing / Quality','文件':'Documents','規格':'Specs'};
function grpLabel(g){ return t(g, GRP_EN[g]||g); }
function fLabel(f){ return t(f.label, f.labelEn||f.label); }
function fVal(f){ return t(f.val, f.valEn||f.val); }

/* ---------- 狀態 ---------- */
const dispatched=Bus.get('policy');
const realKeys=dispatched&&dispatched.perStage&&dispatched.perStage[STAGE.id];
const state={
  view:'home',
  policy: realKeys? dispatched : MOCK_POLICY,
  policyIsReal: !!realKeys,
  submission: Bus.get('submission:'+STAGE.id),
  submitted: !!Bus.get('submission:'+STAGE.id),
  preprocessed: false,
  chain:null, chainAnim:null,
};
/* 還原已送出狀態(重新整理後維持一致) */
if(state.submission){
  state.chain=state.submission.block;   /* 平台尚未上鏈時為 null → 顯示「等待平台上鏈」 */
  state.preprocessed=true;
  const dmap={}; state.submission.fields.forEach(f=>dmap[f.key]=f.disclosure);
  FIELDS.forEach(f=>{ if(dmap[f.key]) f.disclosure=dmap[f.key]; });
}

/* ---------- 導覽 ---------- */
const NAV=[
  ['_c1','收集流程','Collection'],
  ['home','首頁','Home'],
  ['inbox','政策收件匣','Policy Inbox','inbox'],
  ['disclose','揭露決策(公開 / 加密)','Disclosure (Public / Encrypted)'],
  ['preprocess','預處理','Preprocess'],
  ['boundary','加密與送出','Encrypt & Submit'],
  ['chain','上鏈狀態','On-chain Status'],
  ['_c2','管理','Manage'],
  ['verify','驗證請求','Verify Requests','verify'],
  ['settings','設定','Settings'],
];
function renderNav(){
  let h='';
  for(const it of NAV){
    if(it[0].startsWith('_c')){h+=`<div class="grp">${t(it[1],it[2])}</div>`;continue;}
    const [v,zh,en,badgeKind]=it;
    const label=t(zh,en);
    let badge='';
    /* 通知燈由狀態驅動:只有「平台已實際派發政策給本廠、且尚未上傳」時才亮。
       離線範例(MOCK_POLICY)不會點亮,避免清空 localStorage 後紅點仍預設恆亮。 */
    if(badgeKind==='inbox'){ if(state.policyIsReal && !state.submitted) badge='<span class="b">1</span>'; }
    if(badgeKind==='verify'){ const n=pendingKeyReqs().length; if(n) badge='<span class="b">'+n+'</span>'; }
    h+=`<a class="${state.view===v?'on':''}" onclick="go('${v}')">${label}${badge}</a>`;
  }
  document.getElementById('nav').innerHTML=h;
}
function renderTopbar(){
  const c=state.policyIsReal;
  document.getElementById('topbar').innerHTML=`
    <span class="brand">${t(STAGE.brand,STAGE.brandEn||STAGE.brand)}</span>
    <span class="role">· ${t('角色','Role')}:${t(STAGE.role,STAGE.roleEn||STAGE.role)} <code>${STAGE.id}</code> · ${t('訂單','Order')} ${state.policy?state.policy.order:STAGE.orderNo}</span>
    <span class="spacer"></span>
    ${state.policyIsReal&&!state.submitted?`<span class="chip warn">${t('待上傳','To upload')}</span>`:''}
    ${state.submitted?`<span class="chip">${t('已上傳','Uploaded')}</span>`:''}
    <span class="chip ${c?'':'demo'}">${c?t('平台已連線','Platform online'):t('離線範例','Offline sample')}</span>
    <span class="chip">${t('TEE 已連','TEE linked')}</span>
    <span class="chip demo">${t('原型 Demo','Prototype Demo')}</span>
    ${langChipHTML()}`;
  document.documentElement.style.setProperty('--rolecolor',STAGE.color);
  document.title=t(STAGE.titleZh,STAGE.titleEn||STAGE.titleZh);
}
function go(v){state.view=v;render();window.scrollTo(0,0);}

/* ---------- helpers ---------- */
const requiredKeys=()=> (state.policy&&state.policy.perStage&&state.policy.perStage[STAGE.id]) || FIELDS.map(f=>f.key);
const requiredFields=()=> FIELDS.filter(f=>requiredKeys().indexOf(f.key)>=0);
const pubCount=()=>requiredFields().filter(f=>f.disclosure==='public').length;
const priCount=()=>requiredFields().filter(f=>f.disclosure==='private').length;
function stepper(cur){
  const steps=[['inbox','收件匣','Inbox'],['disclose','揭露決策','Disclosure'],['preprocess','預處理','Preprocess'],['boundary','加密送出','Encrypt & Submit'],['chain','上鏈','On-chain']];
  const idx=steps.findIndex(s=>s[0]===cur);
  return `<div class="steps">`+steps.map((s,i)=>{
    const cls=i<idx?'done':(i===idx?'on':'');
    return `<span class="s ${cls}" onclick="go('${s[0]}')" style="cursor:pointer">${i<idx?'✓ ':''}${t(s[1],s[2])}</span>`+(i<steps.length-1?'<span class="ar">→</span>':'');
  }).join('')+`</div>`;
}
function scHTML(){
  return `<div class="scbar">`+SC.map((s,i)=>{
    const [key,lbl,subKey,en]=s;
    let cls='';
    if(subKey){ if(subKey===STAGE.id){ cls=state.submitted?'done':'cur'; } else if(Bus.get('submission:'+subKey)){ cls='done'; } }
    else if(key==='poly'){ cls='done'; }
    const me = subKey===STAGE.id?t('(你在這)','(you)'):'';
    return `<span class="st ${cls}">${t(lbl,en)}${me}${cls==='done'?' ✓':(cls==='cur'?' ◷':'')}</span>`+(i<SC.length-1?'<span>→</span>':'');
  }).join('')+`</div>`;
}

/* ---------- Views ---------- */
function vHome(){
  const todo = !state.policyIsReal
    ? `<div class="card" style="border-left:4px solid var(--line)">
        <div class="row"><b>${t('尚未收到收集政策','No collection policy received yet')}</b><span class="pill">${t('離線範例模式','Offline sample mode')}</span></div>
        <p style="margin:6px 0 0">${t('等待平台(Kanesh)依序派發本廠的收集政策。收到後此處會亮起待辦、側欄通知燈才會點亮。','Waiting for the platform (Kanesh) to dispatch the collection policy for this factory. Once received, a task appears here and the sidebar badge lights up.')}</p></div>`
    : !state.submitted
    ? `<div class="card" style="border-left:4px solid var(--accent)">
        <div class="row"><b>${t('1 筆收集政策待上傳','1 collection policy awaiting upload')}</b><span class="pill">${t('來自','From')} ${state.policy.issuer} · ${t('訂單','Order')} ${state.policy.order}</span>
        <span class="right"></span><button class="btn pri" onclick="go('inbox')">${t('前往決策','Go to decision')} →</button></div>
        <p style="margin:6px 0 0">${t('截止','Deadline')} ${state.policy.deadline} · ${t('設定哪些公開、哪些加密後上傳本廠資料','choose which fields are public / encrypted, then upload this factory data')}</p></div>`
    : `<div class="card" style="border-left:4px solid var(--good)">
        <div class="row"><b>${t('本廠資料已送回平台','Data sent back to platform')}${state.chain?t(' · 已上鏈',' · on-chain'):t(' · 等待平台上鏈',' · awaiting platform mint')}</b>${state.chain?`<span class="pill">Token #${state.chain.tokenId}</span>`:''}
        <span class="right"></span><button class="btn" onclick="go('chain')">${t('查看上鏈狀態','View on-chain status')} →</button></div>
        <p style="margin:6px 0 0">${t('明文','Public')} ${state.submission.publicCount} ${t('欄','fields')} · ${t('加密','Encrypted')} ${state.submission.privateCount} ${t('欄 已送回平台','fields sent to platform')}</p></div>`;
  return `
  <div class="eyebrow">${t('工廠端 Endpoint','Factory Endpoint')} · ${t(STAGE.label,STAGE.labelEn||STAGE.label)}</div><h1>${t('首頁','Home')}</h1>
  <h2>${t('待辦','To do')}</h2>
  ${todo}

  <h2>${t('本廠在供應鏈的位置','Where this factory sits in the supply chain')}(${t('本批','Batch')} ${state.policy.order})</h2>
  ${scHTML()}
  <p class="vis">${t('只顯示本段與前後棒狀態;不揭露其他工廠身分(藏供應圖)。','Only this stage and adjacent status are shown; identities of other factories stay hidden (supply map concealed).')}</p>

  <h2>${t('系統健康','System health')}</h2>
  <div class="grid2">
    <div class="card"><b>${t('Endpoint 上線','Endpoint online')}</b><p>${t('本地服務運行中,離線時可先處理、連線後續傳。','Local service running; can process offline and sync when reconnected.')}</p></div>
    <div class="card"><b>${t('TEE 已連線 · 錢包就緒','TEE linked · Wallet ready')}</b><p>${t('加密金鑰托管於安全模組;可進行簽署。','Encryption keys held in the secure module; ready to sign.')}</p></div>
  </div>
  <div class="callout info"><div class="t">${t('本批最終護照','Final passport for this batch')}</div>${t('由平台彙整三廠明文後產生 DPP / QR(唯讀);本廠負責把自己這段的資料按揭露設定送回。','The platform compiles public data from all three factories into the DPP / QR (read-only); this factory only returns its own stage per the disclosure settings.')}</div>`;
}

function vInbox(){
  const p=state.policy;
  if(!state.policyIsReal && !state.submitted){
    return `${stepper('inbox')}<h1>${t('政策收件匣','Policy Inbox')}</h1>
    <p>${t('雲端(平台 / DPP 發行方)送來「要收哪些特徵、保存多久」。對應工作流①下行。','The cloud (platform / DPP issuer) sends down which features to collect and how long to retain them — the downlink of workflow ①.')}</p>
    <div class="card" style="border-left:4px solid var(--line)">
      <div class="row"><b>${t('尚未收到收集政策','No collection policy received yet')}</b><span class="pill">${t('等待平台派發','Awaiting platform dispatch')}</span></div>
      <p style="margin:6px 0 0">${t('尚未有任何收集政策送達本廠。請在平台(Kanesh)「政策建構器」派發','No collection policy has reached this factory yet. Dispatch a policy for the')} ${t(STAGE.label,STAGE.labelEn||STAGE.label)} ${t('站的政策;收到後這裡會出現待決策的政策卡、側欄通知燈也會亮。','stage from the platform (Kanesh) Policy Builder; once received, a decision card appears here and the sidebar badge lights up.')}</p>
    </div>
    <div class="callout info"><div class="t">${t('離線範例','Offline sample')}</div>${t('未連線平台時,可直接到「揭露決策」用內建範例資料體驗流程。','When not connected to the platform, go straight to Disclosure to try the flow with built-in sample data.')}</div>`;
  }
  const tag=state.policyIsReal?`<span class="chip">${t('平台即時派發','Live from platform')}</span>`:`<span class="chip demo">${t('內建範例','Built-in sample')}</span>`;
  return `${stepper('inbox')}<h1>${t('政策收件匣','Policy Inbox')}</h1>
  <p>${t('雲端(平台 / DPP 發行方)送來「要收哪些特徵、保存多久」。對應工作流①下行。','The cloud (platform / DPP issuer) sends down which features to collect and how long to retain them — the downlink of workflow ①.')}</p>
  ${state.submitted?`<div class="callout key"><div class="t">✓ ${t('已完成','Done')}</div>${t('本政策的資料已上傳上鏈;側欄通知燈已熄滅。可在「上鏈狀態」查看。','This policy data has been uploaded and minted; the sidebar badge is off. See On-chain Status.')}</div>`:''}
  <div class="card" style="border-left:4px solid var(--accent)">
    <div class="row"><b>${t('收集政策 · 訂單','Collection policy · Order')} ${p.order}</b><span class="right"></span>${tag} <span class="chip">${t('數位簽章 ✓ 已驗證','Signature ✓ verified')}</span></div>
    <div class="kv">${t('發送方','Issuer')}:${p.issuer}</div>
    <div class="kv">${t('要收集(本階段','To collect (stage')} ${t(STAGE.label,STAGE.labelEn||STAGE.label)}):<b>${requiredFields().length} ${t('個特徵','features')}</b> · ${t('保存年限','Retention')}:${p.retentionYears} ${t('年','yr')}</div>
    <div class="kv">${t('截止','Deadline')}:${p.deadline}</div>
    <div class="row" style="margin-top:12px">
      <button class="btn pri" onclick="go('disclose')">${t('檢視並決策','Review & decide')} →</button>
      <button class="btn ghost" onclick="showPolicyJson()">${t('看政策 JSON','View policy JSON')} ▾</button>
    </div>
  </div>
  <div class="callout key"><div class="t">✓ ${t('為什麼可信','Why trustworthy')}</div>${t('這份政策用平台私鑰簽章,你的 endpoint 用平台公鑰驗過了。若驗章失敗會擋下並警示。','This policy is signed with the platform private key and verified by your endpoint using the platform public key. A failed check is blocked and flagged.')}</div>`;
}

function vDisclose(){
  if(state.submitted) return `${stepper('chain')}<h1>${t('揭露決策','Disclosure')}</h1><div class="callout key"><div class="t">✓ ${t('已送出鎖定','Submitted & locked')}</div>${t('本批已上鏈,揭露設定不可再改。','This batch is on-chain; disclosure settings can no longer be changed.')}<div class="row" style="margin-top:8px"><button class="btn" onclick="go('chain')">${t('看上鏈狀態','View on-chain status')} →</button></div></div>`;
  let rows='',lastGrp='';
  for(const f of requiredFields()){
    if(f.grp!==lastGrp){rows+=`<tr class="grphead"><td colspan="3">▸ ${grpLabel(f.grp)}</td></tr>`;lastGrp=f.grp;}
    const pub=f.disclosure==='public';
    rows+=`<tr>
      <td>${pub?'':''} ${fLabel(f)} ${f.sensitive?`<span class="jewelmark">${t('機密','Confidential')}</span>`:''}</td>
      <td class="fval">${fVal(f)}</td>
      <td><span class="seg">
        <button class="pub ${pub?'on':''}" onclick="setDisc('${f.id}','public')">${t('公開','Public')}</button>
        <button class="pri ${!pub?'on':''}" onclick="setDisc('${f.id}','private')">${t('加密','Encrypt')}</button>
      </span></td>
    </tr>`;
  }
  return `${stepper('disclose')}<h1>${t('揭露決策工作台','Disclosure Workbench')}</h1>
  <p>${t('本廠唯一能決定的是:每個欄位','The only choice this factory makes: for each field,')}<b>${t('上傳時公開(明文)或加密(密文)','upload as public (plaintext) or encrypted (ciphertext)')}</b>。<b>${t('誰能看到資料','Who can see the data')}</b>${t('由平台統一控管,工廠不在此決定。雲端要的','is governed by the platform, not decided here. All')} <b>${requiredFields().length} ${t('個欄位全部都會送出','required fields are sent')}</b>${t(';公開的進 DPP,加密的平台讀不到。','; public ones go into the DPP, encrypted ones the platform cannot read.')}</p>
  <div class="summary">
    <div>${t('邊界摘要','Boundary summary')}</div>
    <div>${t('公開','Public')} <span class="big" style="color:var(--good)">${pubCount()}</span></div>
    <div>${t('加密','Encrypted')} <span class="big" style="color:var(--jewel)">${priCount()}</span></div>
    <span class="right"></span>
    <button class="btn" onclick="applyRec()">${t('套用建議設定','Apply recommended')}</button>
  </div>
  <table class="ftable">
    <tr><th>${t('欄位','Field')}</th><th>${t('值(預覽)','Value (preview)')}</th><th>${t('上傳方式','Upload as')}</th></tr>
    ${rows}
  </table>
  <div class="callout jewel"><div class="t">${t('為什麼能放心','Why it is safe')}</div>${t('加密欄位送到雲端是「打不開的密文」(本原型以模擬呈現)。鑰匙留在你的 TEE,平台與其他工廠都讀不到。文件預設只上傳雜湊,本體留在你這。','Encrypted fields leave as ciphertext that cannot be opened (simulated in this prototype). Keys stay in your TEE; neither the platform nor other factories can read them. Documents upload only their hash by default; the file stays with you.')}</div>
  <div class="row"><span class="right"></span><button class="btn pri" onclick="go('preprocess')">${t('下一步:預處理','Next: Preprocess')} →</button></div>`;
}

function vPreprocess(){
  const done=state.preprocessed;
  return `${stepper('preprocess')}<h1>${t('預處理','Preprocess')}</h1>
  <p>${t('把原始資料整成上傳格式。程式碼公開可稽核。','Normalize raw data into the upload format. The code is open for audit.')}</p>
  <div class="card">
    <div class="kv">${t('來源:本地 MES 匯出','Source: local MES export')} <code>${STAGE.id}_log_2207.csv</code></div>
    <div class="kv">${t('腳本','Script')}:<code>${STAGE.id}-preprocess v1.4</code> · ${t('程式碼雜湊','code hash')} <code>9f2c…</code> · ${t('公開可稽核','open for audit')}</div>
    <div class="row" style="margin-top:10px"><button class="btn pri" onclick="runPre()" ${done?'disabled':''}>▶ ${t('執行預處理','Run preprocess')}</button>
      <span id="preState" class="vis">${done?`✓ ${t('完成','Done')} · `+requiredFields().length+'/'+requiredFields().length+` ${t('欄位已對齊','fields aligned')}`:''}</span></div>
    <div class="bar"><i id="preBar" style="width:${done?100:0}%"></i></div>
  </div>
  <div id="preOut">${done?preOutHTML():''}</div>`;
}
function preOutHTML(){
  const o={stage:STAGE.id, order:state.policy.order};
  requiredFields().forEach(f=>o[f.key]= f.disclosure==='public'? fVal(f) : 'ENC('+t('加密','encrypted')+')');
  return `<h3>${t('預覽:正規化後的 canonical JSON(送出前的樣子)','Preview: normalized canonical JSON (as it will be sent)')}</h3>
  <pre class="code">${JSON.stringify(o,null,2).replace(/</g,'&lt;')}</pre>
  <div class="callout key"><div class="t">✓ ${t('對應檢查','Coverage check')}</div>${t('雲端要的','The')} ${requiredFields().length} ${t('欄位 → 已對齊。其中 ','required fields → aligned. Of these ')} ${pubCount()} ${t('公開、','public, ')} ${priCount()} ${t('加密(送出前仍可回上一步調整)。','encrypted (you can still go back and adjust before sending).')}</div>
  <div class="row"><span class="right"></span><button class="btn pri" onclick="go('boundary')">${t('下一步:加密與送出','Next: Encrypt & Submit')} →</button></div>`;
}

function vBoundary(){
  if(state.submitted) return `${stepper('chain')}<h1>${t('已送出','Submitted')}</h1><div class="callout key"><div class="t">✓ ${t('已上鏈','On-chain')}</div>${t('本批封包已送回平台並上鏈。','This batch has been sent to the platform and minted.')}<div class="row" style="margin-top:8px"><button class="btn" onclick="go('chain')">${t('看上鏈狀態','View on-chain status')} →</button></div></div>`;
  const pub=requiredFields().filter(f=>f.disclosure==='public');
  const pri=requiredFields().filter(f=>f.disclosure==='private');
  return `${stepper('boundary')}<h1>${t('即將送出 · 邊界預覽','Ready to send · Boundary preview')}</h1>
  <p>${t('下面是「會離開你工廠」的封包內容。確認後即上傳並上鏈,','Below is the packet that will leave your factory. After you confirm it is uploaded and minted, ')}<b>${t('上鏈後不可修改','and cannot be changed once on-chain')}</b>。</p>

  <div class="bdcol pub"><h4>${t('會以「明文」離開(任何人可見 · 進 DPP) ·','Leaves as plaintext (visible to all · into DPP) ·')} ${pub.length}</h4>
    ${pub.map(f=>`<div class="kv">${fLabel(f)} = ${fVal(f)}</div>`).join('')||`<div class="kv">${t('(無)','(none)')}</div>`}</div>

  <div class="bdcol pri"><h4>${t('會以「密文」離開(平台讀不到,需你放行才可解) ·','Leaves as ciphertext (platform cannot read; needs your release to decrypt) ·')} ${pri.length}</h4>
    ${pri.map(f=>`<div class="kv">${fLabel(f)} = ••••••••</div>`).join('')||`<div class="kv">${t('(無)','(none)')}</div>`}
    <div class="kv" style="margin-top:6px;color:var(--jewel)">${t('└ 加密金鑰:本地產生,已托管 TEE(可隨時撤回)','└ Encryption key: generated locally, held in TEE (revocable anytime)')}</div></div>

  <div class="bdcol att"><h4>${t('一起送出的還有(防竄改用,不含內容)','Also sent (tamper-evidence, no content)')}</h4>
    <div class="kv">${t('完整紀錄雜湊 · 各文件雜湊 · 你的數位簽章','Full-record hash · per-document hashes · your digital signature')}</div>
    <div class="kv">${t('製程階段 ID','Process stage ID')}:${STAGE.id}${STAGE.prev?(' · '+t('前一段參考','prev-stage ref')+':'+STAGE.prev+' '+t('區塊','block')):' · '+t('本鏈第一段(無前棒)','first on this chain (no predecessor)')}</div></div>

  <div class="callout key"><div class="t">${t('平台拿到後','Once the platform receives it')}</div>${t('能驗章確認是你送的,但讀不到任何 欄位;只會用 明文組裝 DPP。送出後由','it can verify the signature but cannot read any field; it assembles the DPP only from plaintext. After sending, the ')}<b>${t('平台執行區塊鏈上鏈','platform performs the on-chain mint')}</b>(mint / ${t('錨定','anchoring')})。</div>

  <div class="row">
    <button class="btn ghost" onclick="go('preprocess')">${t('看完整 JSON','View full JSON')} ▾</button>
  </div>
  <div class="row" style="margin-top:14px">
    <button class="btn" onclick="go('disclose')">← ${t('回去改揭露設定','Back to disclosure')}</button>
    <span class="right"></span>
    <button class="btn pri" onclick="askSign()">${t('簽署並送出','Sign & submit')}</button>
  </div>`;
}

function vChain(){
  if(!state.submitted){
    return `${stepper('chain')}<h1>${t('上鏈狀態','On-chain Status')}</h1><div class="callout info"><div class="t">${t('尚未送出','Not submitted yet')}</div>${t('請先在「加密與送出」完成簽署。','Complete signing in Encrypt & Submit first.')}<div class="row" style="margin-top:8px"><button class="btn" onclick="go('boundary')">${t('前往送出','Go to submit')} →</button></div></div>`;
  }
  const c=state.chain; const waiting=!c;   /* 平台尚未回填 block(由平台執行上鏈) */
  const step=state.chainAnim?state.chainAnim.step:(waiting?2:5);
  const li=(k,label)=>`<li class="${step>k?'done':(step===k?'cur':'')}"><span class="dot">${step>k?'✓':k+1}</span>${label}</li>`;
  return `${stepper('chain')}<h1>${t('上鏈狀態','On-chain Status')} · ${t(STAGE.label,STAGE.labelEn||STAGE.label)} ${state.policy.order}</h1>
  <ul class="timeline">
    ${li(0,t('本地簽署 / 加密 / 雜湊','Local sign / encrypt / hash'))}
    ${li(1,t('送回雲端平台','Send back to platform'))}
    ${li(2,t('平台驗章','Platform verifies signature'))}
    ${li(3,t('平台 Mint ERC-721 區塊','Platform mints ERC-721 block'))}
    ${li(4,t('錨定完成(接續前一段)','Anchored (linked to previous)'))}
  </ul>
  ${(!waiting && step>=5)?`<div class="card">
    <div class="kv">Token ID:<b>#${c.tokenId}</b> · ${t('鏈上序位 index','on-chain index')} ${c.index}</div>
    <div class="kv">${t('交易雜湊','Tx hash')}:${c.real&&c.txHash?`<a href="https://sepolia.etherscan.io/tx/${c.txHash}" target="_blank" rel="noopener">${c.txHash} ↗</a>`:`${c.txHash||t('(模擬)','(simulated)')} <span class="pill">${c.real===false?t('模擬','Simulated'):t('在區塊瀏覽器查看 ↗','View in explorer ↗')}</span>`}</div>
    <div class="kv">${t('時間戳','Timestamp')}:${c.timestamp}</div>
    <div class="kv">${t('Metadata 雜湊','Metadata hash')}:${c.metadataHash}</div>
    ${c.real?`<div class="kv">tokenURI:${c.gatewayURL?`<a href="${c.gatewayURL}" target="_blank" rel="noopener">${c.tokenURI}</a>`:(c.tokenURI||'')}</div>
    <div class="kv">${t('前一段 token','Previous token')}:${c.prevTokenId||t('(無 · 本鏈第一段)','(none · first on chain)')}</div>`
    :`<div class="kv">${t('本段雜湊 hash','Stage hash')}:${c.hash}</div>
    <div class="kv">${t('前一段參考 prevHash','Previous prevHash')}:${c.prevHash||t('(無 · 本鏈第一段)','(none · first on chain)')}</div>`}
    <div class="kv" style="color:var(--good)">${t('狀態','Status')}:${c.real?t('已上鏈 Sepolia','On-chain Sepolia'):t('已上鏈(模擬)','On-chain (simulated)')} · ${t('已送回平台','sent to platform')}</div>
    <div class="callout jewel" style="margin-top:10px"><div class="t">${t('你保留的','What you keep')}</div>${t('本批加密欄位的鑰匙(在 TEE)。密文平台讀不到;是否釋出、給誰解密由本廠在「驗證請求」放行,其餘由平台統一控管。','The keys for this batch encrypted fields (in the TEE). The platform cannot read the ciphertext; whether to release decryption is approved by this factory under Verify Requests, everything else is governed by the platform.')}</div>
    <div class="row"><span class="right"></span><button class="btn pri" onclick="go('home')">${t('完成 · 回首頁','Done · Home')}</button></div>
  </div>`:`<div class="callout info"><div class="t">⏳ ${t('已送出 · 等待平台上鏈','Submitted · awaiting platform mint')}</div>${t('本廠已將「簽署 + 加密邊界」送回平台;','This factory has sent the signed + encrypted boundary back to the platform; ')}<b>${t('區塊鏈(mint / 錨定)由平台執行','the platform performs the on-chain mint / anchoring')}</b>${t(',完成後此處會顯示 Token 與 hash。請保持','. Once done, the Token and hash appear here. Keep ')} <code>platform.html</code> ${t('開啟。','open.')}</div>`}`;
}

function vSimple(title,body){return `<h1>${title}</h1>${body}`;}

/* ---------- 驗證請求 / 金鑰放行(平台向本廠申請解密加密欄位)---------- */
function myKeyReqs(){ return (Bus.get('keyRequests')||[]).filter(r=>r.stage===STAGE.id); }
function pendingKeyReqs(){ return myKeyReqs().filter(r=>r.status==='pending'); }
function decideKey(key,decision){
  const reqs=Bus.get('keyRequests')||[];
  const r=reqs.find(x=>x.stage===STAGE.id && x.key===key);
  if(!r){ toast(t('找不到該請求','Request not found')); return; }
  r.status=decision; r.decidedTs=nowUTC();
  Bus.set('keyRequests',reqs);
  toast(decision==='approved'?t('已放行:平台法規端可解密此欄位','Released: the platform regulator view can decrypt this field'):t('已拒絕:維持不可解密','Denied: stays undecryptable'));
  render();
}
function vVerify(){
  const reqs=myKeyReqs();
  const labelOf=k=>{const f=FIELDS.find(x=>x.key===k);return f?fLabel(f):k;};
  const rows=reqs.map(r=>{
    let action;
    if(r.status==='approved') action=`<span class="chip">${t('已放行','Released')}</span> <button class="btn ghost" onclick="decideKey('${r.key}','denied')">${t('收回','Revoke')}</button>`;
    else if(r.status==='denied') action=`<span class="chip warn">${t('已拒絕','Denied')}</span> <button class="btn ghost" onclick="decideKey('${r.key}','approved')">${t('改為放行','Release instead')}</button>`;
    else action=`<button class="btn pri" onclick="decideKey('${r.key}','approved')">${t('放行解密','Release')}</button> <button class="btn warn" onclick="decideKey('${r.key}','denied')">${t('拒絕','Deny')}</button>`;
    return `<tr><td>${labelOf(r.key)}</td><td class="fval">${r.key}</td><td class="fval">${r.ts||''}</td><td>${action}</td></tr>`;
  }).join('');
  return `<h1>${t('驗證請求 · 金鑰放行','Verify Requests · Key Release')}</h1>
  <p>${t('平台(供法規查驗)針對本廠','The platform (for regulator audit) requests decryption keys for this factory')}<b>${t('加密上傳','encrypted')}</b>${t('的欄位申請解密鑰匙。可逐項','fields. Approve each one to')}<b>${t('放行','release')}</b>${t('或','or')}<b>${t('拒絕','deny')}</b>${t(';放行後,平台「法規機關」視角才看得到該欄位原始值(對應工作流②)。','; once released, the platform regulator view can see the original value (workflow ②).')}</p>
  ${reqs.length?`<table class="ftable"><tr><th>${t('欄位','Field')}</th><th>key</th><th>${t('申請時間','Requested at')}</th><th>${t('決定','Decision')}</th></tr>${rows}</table>`
    :`<div class="card" style="border-left:4px solid var(--line)"><div class="row"><b>${t('目前沒有待處理的驗證請求','No pending verify requests')}</b></div>
       <p style="margin:6px 0 0">${t('當平台在其「金鑰 / 驗證請求」頁向本廠申請某個加密欄位的解密鑰匙時,這裡會出現待放行項目、側欄通知燈也會亮。','When the platform requests a decryption key for one of this factory encrypted fields (from its Keys / Verify Requests page), a pending item appears here and the sidebar badge lights up.')}</p></div>`}
  <div class="callout jewel"><div class="t">${t('解密同意權在本廠','Decryption consent stays with this factory')}</div>${t('資料一律加密送回平台;密文要能被解讀須經本廠在此放行。拒絕則平台 / 法規端維持看不到原始值。','Data is always sent encrypted; ciphertext can only be read after this factory releases it here. Denying keeps the platform / regulator from seeing the original value.')}</div>`;
}

function render(){
  renderTopbar(); renderNav();
  const v=state.view;
  const map={home:vHome,inbox:vInbox,disclose:vDisclose,preprocess:vPreprocess,boundary:vBoundary,chain:vChain,verify:vVerify};
  let html;
  if(map[v]) html=map[v]();
  else if(v==='settings') html=vSimple(t('設定','Settings'),`<div class="card">
    <div class="kv">${t('Endpoint 身分(DID)','Endpoint identity (DID)')}:did:web:${STAGE.id}-factory.example</div>
    <div class="kv">${t('工廠 ID','Factory ID')}:${STAGE.factoryId}</div>
    <div class="kv">${t('錢包位址','Wallet address')}:0x${simpleHash(STAGE.id)}…</div>
    <div class="kv">${t('TEE 連線','TEE link')}:${t('已連線','connected')}</div>
    <div class="kv">${t('資料匯流排','Data bus')}:${state.policyIsReal?t('平台已連線','platform connected'):t('離線(內建範例政策)','offline (built-in sample policy)')}</div>
    <div class="kv">${t('部署模式','Deployment')}:on-prem(Windows ${t('服務','service')} / Linux daemon)</div>
    <div class="kv">${t('本廠權限:決定各欄位「公開 / 加密」,並對平台的解密申請逐項放行 / 拒絕(見「驗證請求」);上鏈與否由平台控管','Factory rights: decide each field public / encrypted, and approve or deny the platform decryption requests per item (see Verify Requests); minting is governed by the platform')}</div>
    <div class="kv">${t('語言','Language')}:${t('繁體中文','English')}</div>
    <div class="row" style="margin-top:10px"><button class="btn warn" onclick="resetSubmission()">${t('重置本廠提交(Demo)','Reset this factory submission (Demo)')}</button></div>
  </div>`);
  else html=vSimple('—','');
  document.getElementById('main').innerHTML=html;
}

/* ---------- 互動 ---------- */
function setDisc(id,val){
  const f=FIELDS.find(x=>x.id===id);
  if(f.disclosure===val) return;
  if(val==='public' && f.sensitive){
    openModal(`<h3>${t('公開機密欄位?','Make a confidential field public?')}</h3>
      <p><b>${fLabel(f)}</b> ${t('被標為商業機密(皇冠寶石)。公開後任何人都看得到,且上鏈後不可收回明文。確定嗎?','is marked a trade secret (crown jewel). Once public, anyone can see it and the plaintext cannot be retracted after it is on-chain. Are you sure?')}</p>
      <div class="row"><span class="right"></span><button class="btn" onclick="closeModal()">${t('取消','Cancel')}</button>
      <button class="btn warn" onclick="closeModal();doSetDisc('${id}','public')">${t('仍要公開','Make public anyway')}</button></div>`);
    return;
  }
  doSetDisc(id,val);
}
function doSetDisc(id,val){FIELDS.find(x=>x.id===id).disclosure=val; state.preprocessed=false; render();}
function applyRec(){FIELDS.forEach(f=>f.disclosure=f.rec); state.preprocessed=false; toast(t('已套用建議設定','Recommended settings applied')); render();}

function runPre(){
  const bar=document.getElementById('preBar'); const st=document.getElementById('preState');
  let p=0; if(st)st.textContent=t('正在正規化欄位…','Normalizing fields…');
  const iv=setInterval(()=>{p+=20; if(bar)bar.style.width=p+'%';
    if(p>=100){clearInterval(iv); state.preprocessed=true; render();}},150);
}

function askSign(){
  openModal(`<h3>${t('簽署並送出','Sign & submit')}</h3>
    <p>${t('你即將用','You are about to use the ')}<b>${t('工廠錢包','factory wallet')}</b>${t('簽署並送回本批封包給平台。送回後由','to sign and send this packet back to the platform. After sending, the ')}<b>${t('平台上鏈','platform mints it')}</b>,<b>${t('內容不可修改','the content cannot be changed')}</b>。</p>
    <p class="vis">${t('公開','Public')} ${pubCount()} · ${t('加密','Encrypted')} ${priCount()}</p>
    <div class="row"><span class="right"></span><button class="btn" onclick="closeModal()">${t('取消','Cancel')}</button>
    <button class="btn pri" onclick="closeModal();doSign()">${t('確認簽署(錢包)','Confirm sign (wallet)')}</button></div>`);
}
function doSign(){
  const fields=requiredFields().map(f=>({key:f.key,label:f.label,labelEn:f.labelEn||null,grp:f.grp,kind:f.kind,sensitive:f.sensitive,
    disclosure:f.disclosure,
    val: f.disclosure==='public'? f.val : null,
    valEn: f.disclosure==='public'? (f.valEn||null) : null,
    cipher: f.disclosure==='private'? ('ENC('+simpleHash(f.key+f.val).slice(0,6)+'…)') : null}));
  const metadataHash=simpleHash(JSON.stringify(fields)+STAGE.id+(state.policy?state.policy.id:''));
  /* ============================================================
     工廠端只負責「簽署 + 加密邊界」,不自行上鏈。
     區塊鏈(mint / 錨定)由平台在收到本提交後執行。
     對應整合點:見 platform.html 的「BLOCKCHAIN INTEGRATION POINT」。
     送出時 block=null,平台上鏈後會把 block 回填到同一筆 submission。
     ============================================================ */
  const submission={stage:STAGE.id, stageLabel:STAGE.label, order:STAGE.order, factoryId:STAGE.factoryId,
    orderNo:state.policy.order, policyId:state.policy?state.policy.id:null, ts:nowUTC(),
    fields, publicCount:pubCount(), privateCount:priCount(),
    metadataHash, signature:'0x'+simpleHash(metadataHash+STAGE.id)+'…',
    block:null};
  Bus.set('submission:'+STAGE.id, submission);
  state.submission=submission; state.chain=null; state.submitted=true;
  state.chainAnim={step:0};
  go('chain');
  /* 推進動畫到「等待平台上鏈」(step 2);其餘步驟待平台回填 block 後在 onChange 完成 */
  const iv=setInterval(()=>{ if(state.chainAnim&&state.chainAnim.step<2){state.chainAnim.step++; render();} else {clearInterval(iv);} },650);
}

function resetSubmission(){Bus.del('submission:'+STAGE.id); state.submitted=false; state.submission=null; state.chain=null; state.preprocessed=false; FIELDS.forEach(f=>f.disclosure=f.rec); toast(t('已重置本廠提交','This factory submission has been reset')); go('home');}

function showPolicyJson(){
  const p=state.policy;
  openModal(`<h3>${t('政策 JSON','Policy JSON')}</h3><pre class="code">${JSON.stringify({order:p.order,issuer:p.issuer,signature:p.sig,retention_years:p.retentionYears,stage:STAGE.id,features:requiredKeys()},null,2).replace(/</g,'&lt;')}</pre><div class="row"><span class="right"></span><button class="btn" onclick="closeModal()">${t('關閉','Close')}</button></div>`);
}

/* ---------- modal / toast ---------- */
function openModal(html){document.getElementById('modalBody').innerHTML=html;document.getElementById('modal').classList.remove('hidden');}
function closeModal(){document.getElementById('modal').classList.add('hidden');}
function toast(msg){
  const d=document.createElement('div');
  d.textContent=msg;
  d.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1B1A16;color:#F4F1E9;padding:10px 18px;border-radius:999px;font-size:13.5px;z-index:80;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:90vw';
  document.body.appendChild(d); setTimeout(()=>d.remove(),2800);
}
document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});

/* ---------- 跨檔事件:平台派發政策 / 重置時即時反應 ---------- */
Bus.onChange((key,val)=>{
  if(key==='policy'){
    /* 平台依序派發:只有當政策內含「本廠」這一站時才點亮。其他站被派發時不打擾本廠。 */
    if(val&&val.perStage&&val.perStage[STAGE.id]){
      const wasReal=state.policyIsReal;
      state.policy=val; state.policyIsReal=true;
      if(!state.submitted){
        if(!state.submission||state.submission.policyId!==val.id){state.submission=null; state.chain=null; state.preprocessed=false; FIELDS.forEach(f=>f.disclosure=f.rec);}
        if(!wasReal) toast(''+t('收到本廠收集政策','Received collection policy')+' '+val.id+' · '+t('請完成揭露決策並上傳','complete disclosure and upload'));
        render();
      }
    }
  }
  /* 平台上鏈後把 block 回填到本廠的 submission → 顯示 Token / hash */
  if(key==='submission:'+STAGE.id && val && val.block){
    state.submission=val; state.chain=val.block; state.submitted=true;
    toast(''+t('平台已完成上鏈','Platform minted on-chain')+' · Token #'+val.block.tokenId);
    if(state.chainAnim){
      const t=setInterval(()=>{state.chainAnim.step++; render(); if(state.chainAnim.step>=5){clearInterval(t); state.chainAnim=null;}},350);
    } else { render(); }
  }
  /* 另一分頁切換語言 → 本頁同步重繪 */
  if(key==='lang'){ render(); return; }
  /* 平台向本廠申請解密某加密欄位 → 亮通知燈、提示去「驗證請求」放行 */
  if(key==='keyRequests'){
    const pend=(val||[]).filter(r=>r.stage===STAGE.id && r.status==='pending').length;
    if(pend) toast(''+t('平台申請解密本廠','Platform requests decryption of')+' '+pend+' '+t('個欄位 · 請至「驗證請求」放行','field(s) · release under Verify Requests'));
    render();
  }
  if(key==='reset'){ Bus.del('submission:'+STAGE.id); state.submitted=false; state.submission=null; state.chain=null; state.preprocessed=false; FIELDS.forEach(f=>f.disclosure=f.rec); render(); }
});

render();
