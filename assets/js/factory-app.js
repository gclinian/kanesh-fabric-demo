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
const SC=[['poly','聚酯',null],['spin','紡紗','spin'],['weave','織布','weave'],['dye','染整','dye'],['cmt','成衣',null],['DPP','護照',null]];

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
  ['_c1','收集流程'],
  ['home','▣ 首頁'],
  ['inbox','📥 政策收件匣','inbox'],
  ['disclose','🎛 揭露決策(公開 / 加密)'],
  ['preprocess','⚙ 預處理'],
  ['boundary','🔏 加密與送出'],
  ['chain','⛓ 上鏈狀態'],
  ['_c2','管理'],
  ['verify','🔓 驗證請求','verify'],
  ['settings','⚙ 設定'],
];
function renderNav(){
  let h='';
  for(const it of NAV){
    if(it[0].startsWith('_c')){h+=`<div class="grp">${it[1]}</div>`;continue;}
    const [v,label,badgeKind]=it;
    let badge='';
    /* ★ 通知燈由狀態驅動:只有「平台已實際派發政策給本廠、且尚未上傳」時才亮。
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
    <span class="brand">${STAGE.brand}</span>
    <span class="role">· 角色:${STAGE.role} <code>${STAGE.id}</code> · 訂單 ${state.policy?state.policy.order:STAGE.orderNo}</span>
    <span class="spacer"></span>
    ${state.policyIsReal&&!state.submitted?'<span class="chip warn">📥 待上傳</span>':''}
    ${state.submitted?'<span class="chip">✅ 已上傳</span>':''}
    <span class="chip ${c?'':'demo'}">${c?'🔗 平台已連線':'🔌 離線範例'}</span>
    <span class="chip">🔐 TEE 已連</span>
    <span class="chip demo">原型 Demo</span>`;
  document.documentElement.style.setProperty('--rolecolor',STAGE.color);
  document.title=STAGE.titleZh;
}
function go(v){state.view=v;render();window.scrollTo(0,0);}

/* ---------- helpers ---------- */
const requiredKeys=()=> (state.policy&&state.policy.perStage&&state.policy.perStage[STAGE.id]) || FIELDS.map(f=>f.key);
const requiredFields=()=> FIELDS.filter(f=>requiredKeys().indexOf(f.key)>=0);
const pubCount=()=>requiredFields().filter(f=>f.disclosure==='public').length;
const priCount=()=>requiredFields().filter(f=>f.disclosure==='private').length;
function stepper(cur){
  const steps=[['inbox','收件匣'],['disclose','揭露決策'],['preprocess','預處理'],['boundary','加密送出'],['chain','上鏈']];
  const idx=steps.findIndex(s=>s[0]===cur);
  return `<div class="steps">`+steps.map((s,i)=>{
    const cls=i<idx?'done':(i===idx?'on':'');
    return `<span class="s ${cls}" onclick="go('${s[0]}')" style="cursor:pointer">${i<idx?'✓ ':''}${s[1]}</span>`+(i<steps.length-1?'<span class="ar">→</span>':'');
  }).join('')+`</div>`;
}
function scHTML(){
  return `<div class="scbar">`+SC.map((s,i)=>{
    const [key,lbl,subKey]=s;
    let cls='';
    if(subKey){ if(subKey===STAGE.id){ cls=state.submitted?'done':'cur'; } else if(Bus.get('submission:'+subKey)){ cls='done'; } }
    else if(key==='poly'){ cls='done'; }
    const me = subKey===STAGE.id?'(你在這)':'';
    return `<span class="st ${cls}">${lbl}${me}${cls==='done'?' ✓':(cls==='cur'?' ◷':'')}</span>`+(i<SC.length-1?'<span>→</span>':'');
  }).join('')+`</div>`;
}

/* ---------- Views ---------- */
function vHome(){
  const todo = !state.policyIsReal
    ? `<div class="card" style="border-left:4px solid var(--line)">
        <div class="row"><b>⚪ 尚未收到收集政策</b><span class="pill">離線範例模式</span></div>
        <p style="margin:6px 0 0">等待平台(Kanesh)依序派發本廠的收集政策。收到後此處會亮起待辦、側欄通知燈才會點亮。</p></div>`
    : !state.submitted
    ? `<div class="card" style="border-left:4px solid var(--accent)">
        <div class="row"><b>📥 1 筆收集政策待上傳</b><span class="pill">來自 ${state.policy.issuer} · 訂單 ${state.policy.order}</span>
        <span class="right"></span><button class="btn pri" onclick="go('inbox')">前往決策 →</button></div>
        <p style="margin:6px 0 0">截止 ${state.policy.deadline} · 設定哪些公開、哪些加密後上傳本廠資料</p></div>`
    : `<div class="card" style="border-left:4px solid var(--good)">
        <div class="row"><b>✅ 本廠資料已送回平台${state.chain?' · 已上鏈':' · 等待平台上鏈'}</b>${state.chain?`<span class="pill">Token #${state.chain.tokenId}</span>`:''}
        <span class="right"></span><button class="btn" onclick="go('chain')">查看上鏈狀態 →</button></div>
        <p style="margin:6px 0 0">🌐 明文 ${state.submission.publicCount} 欄 · 🔒 加密 ${state.submission.privateCount} 欄 已送回平台</p></div>`;
  return `
  <div class="eyebrow">工廠端 Endpoint · ${STAGE.label}</div><h1>首頁</h1>
  <h2>待辦</h2>
  ${todo}

  <h2>本廠在供應鏈的位置(本批 ${state.policy.order})</h2>
  ${scHTML()}
  <p class="vis">只顯示本段與前後棒狀態;不揭露其他工廠身分(藏供應圖)。</p>

  <h2>系統健康</h2>
  <div class="grid2">
    <div class="card"><b>🟢 Endpoint 上線</b><p>本地服務運行中,離線時可先處理、連線後續傳。</p></div>
    <div class="card"><b>🔐 TEE 已連線 · 👛 錢包就緒</b><p>加密金鑰托管於安全模組;可進行簽署。</p></div>
  </div>
  <div class="callout info"><div class="t">🛈 本批最終護照</div>由平台彙整三廠明文後產生 DPP / QR(唯讀);本廠負責把自己這段的資料按揭露設定送回。</div>`;
}

function vInbox(){
  const p=state.policy;
  if(!state.policyIsReal && !state.submitted){
    return `${stepper('inbox')}<h1>政策收件匣</h1>
    <p>雲端(平台 / DPP 發行方)送來「要收哪些特徵、保存多久」。對應工作流①下行。</p>
    <div class="card" style="border-left:4px solid var(--line)">
      <div class="row"><b>⚪ 尚未收到收集政策</b><span class="pill">等待平台派發</span></div>
      <p style="margin:6px 0 0">尚未有任何收集政策送達本廠。請在平台(Kanesh)「政策建構器」派發 ${STAGE.label} 站的政策;收到後這裡會出現待決策的政策卡、側欄通知燈也會亮。</p>
    </div>
    <div class="callout info"><div class="t">🔌 離線範例</div>未連線平台時,可直接到「揭露決策」用內建範例資料體驗流程。</div>`;
  }
  const tag=state.policyIsReal?'<span class="chip">🔗 平台即時派發</span>':'<span class="chip demo">內建範例</span>';
  return `${stepper('inbox')}<h1>政策收件匣</h1>
  <p>雲端(平台 / DPP 發行方)送來「要收哪些特徵、保存多久」。對應工作流①下行。</p>
  ${state.submitted?'<div class="callout key"><div class="t">✓ 已完成</div>本政策的資料已上傳上鏈;側欄通知燈已熄滅。可在「上鏈狀態」查看。</div>':''}
  <div class="card" style="border-left:4px solid var(--accent)">
    <div class="row"><b>🟦 收集政策 · 訂單 ${p.order}</b><span class="right"></span>${tag} <span class="chip">數位簽章 ✓ 已驗證</span></div>
    <div class="kv">發送方:${p.issuer}</div>
    <div class="kv">要收集(本階段 ${STAGE.label}):<b>${requiredFields().length} 個特徵</b> · 保存年限:${p.retentionYears} 年</div>
    <div class="kv">截止:${p.deadline}</div>
    <div class="row" style="margin-top:12px">
      <button class="btn pri" onclick="go('disclose')">檢視並決策 →</button>
      <button class="btn ghost" onclick="showPolicyJson()">看政策 JSON ▾</button>
    </div>
  </div>
  <div class="callout key"><div class="t">✓ 為什麼可信</div>這份政策用平台私鑰簽章,你的 endpoint 用平台公鑰驗過了。若驗章失敗會擋下並警示。</div>`;
}

function vDisclose(){
  if(state.submitted) return `${stepper('chain')}<h1>揭露決策</h1><div class="callout key"><div class="t">✓ 已送出鎖定</div>本批已上鏈,揭露設定不可再改。<div class="row" style="margin-top:8px"><button class="btn" onclick="go('chain')">看上鏈狀態 →</button></div></div>`;
  let rows='',lastGrp='';
  for(const f of requiredFields()){
    if(f.grp!==lastGrp){rows+=`<tr class="grphead"><td colspan="3">▸ ${f.grp}</td></tr>`;lastGrp=f.grp;}
    const pub=f.disclosure==='public';
    rows+=`<tr>
      <td>${pub?'🌐':'🔒'} ${f.label} ${f.sensitive?'<span class="jewelmark">⚠機密</span>':''}</td>
      <td class="fval">${f.val}</td>
      <td><span class="seg">
        <button class="pub ${pub?'on':''}" onclick="setDisc('${f.id}','public')">🌐 公開</button>
        <button class="pri ${!pub?'on':''}" onclick="setDisc('${f.id}','private')">🔒 加密</button>
      </span></td>
    </tr>`;
  }
  return `${stepper('disclose')}<h1>揭露決策工作台</h1>
  <p>本廠唯一能決定的是:每個欄位<b>上傳時公開(明文)或加密(密文)</b>。<b>誰能看到資料</b>由平台統一控管,工廠不在此決定。雲端要的 <b>${requiredFields().length} 個欄位全部都會送出</b>;公開的進 DPP,加密的平台讀不到。</p>
  <div class="summary">
    <div>邊界摘要</div>
    <div>🌐 公開 <span class="big" style="color:var(--good)">${pubCount()}</span></div>
    <div>🔒 加密 <span class="big" style="color:var(--jewel)">${priCount()}</span></div>
    <span class="right"></span>
    <button class="btn" onclick="applyRec()">套用建議設定</button>
  </div>
  <table class="ftable">
    <tr><th>欄位</th><th>值(預覽)</th><th>上傳方式</th></tr>
    ${rows}
  </table>
  <div class="callout jewel"><div class="t">🛡 為什麼能放心</div>加密欄位送到雲端是「打不開的密文」(本原型以模擬呈現)。鑰匙留在你的 TEE,平台與其他工廠都讀不到。文件預設只上傳雜湊,本體留在你這。</div>
  <div class="row"><span class="right"></span><button class="btn pri" onclick="go('preprocess')">下一步:預處理 →</button></div>`;
}

function vPreprocess(){
  const done=state.preprocessed;
  return `${stepper('preprocess')}<h1>預處理</h1>
  <p>把原始資料整成上傳格式。程式碼公開可稽核。</p>
  <div class="card">
    <div class="kv">來源:本地 MES 匯出 <code>${STAGE.id}_log_2207.csv</code></div>
    <div class="kv">腳本:<code>${STAGE.id}-preprocess v1.4</code> · 程式碼雜湊 <code>9f2c…</code> · ☑ 公開可稽核</div>
    <div class="row" style="margin-top:10px"><button class="btn pri" onclick="runPre()" ${done?'disabled':''}>▶ 執行預處理</button>
      <span id="preState" class="vis">${done?'✓ 完成 · '+requiredFields().length+'/'+requiredFields().length+' 欄位已對齊':''}</span></div>
    <div class="bar"><i id="preBar" style="width:${done?100:0}%"></i></div>
  </div>
  <div id="preOut">${done?preOutHTML():''}</div>`;
}
function preOutHTML(){
  const o={stage:STAGE.id, order:state.policy.order};
  requiredFields().forEach(f=>o[f.key]= f.disclosure==='public'? f.val : 'ENC(🔒 加密)');
  return `<h3>預覽:正規化後的 canonical JSON(送出前的樣子)</h3>
  <pre class="code">${JSON.stringify(o,null,2).replace(/</g,'&lt;')}</pre>
  <div class="callout key"><div class="t">✓ 對應檢查</div>雲端要的 ${requiredFields().length} 欄位 → 已對齊。其中 🌐 ${pubCount()} 公開、🔒 ${priCount()} 加密(送出前仍可回上一步調整)。</div>
  <div class="row"><span class="right"></span><button class="btn pri" onclick="go('boundary')">下一步:加密與送出 →</button></div>`;
}

function vBoundary(){
  if(state.submitted) return `${stepper('chain')}<h1>已送出</h1><div class="callout key"><div class="t">✓ 已上鏈</div>本批封包已送回平台並上鏈。<div class="row" style="margin-top:8px"><button class="btn" onclick="go('chain')">看上鏈狀態 →</button></div></div>`;
  const pub=requiredFields().filter(f=>f.disclosure==='public');
  const pri=requiredFields().filter(f=>f.disclosure==='private');
  return `${stepper('boundary')}<h1>即將送出 · 邊界預覽</h1>
  <p>下面是「會離開你工廠」的封包內容。確認後即上傳並上鏈,<b>上鏈後不可修改</b>。</p>

  <div class="bdcol pub"><h4>🌐 會以「明文」離開(任何人可見 · 進 DPP) · ${pub.length}</h4>
    ${pub.map(f=>`<div class="kv">${f.label} = ${f.val}</div>`).join('')||'<div class="kv">(無)</div>'}</div>

  <div class="bdcol pri"><h4>🔒 會以「密文」離開(平台讀不到,需你放行才可解) · ${pri.length}</h4>
    ${pri.map(f=>`<div class="kv">${f.label} = ••••••••</div>`).join('')||'<div class="kv">(無)</div>'}
    <div class="kv" style="margin-top:6px;color:var(--jewel)">└ 加密金鑰:本地產生,已托管 TEE(可隨時撤回)</div></div>

  <div class="bdcol att"><h4>🧾 一起送出的還有(防竄改用,不含內容)</h4>
    <div class="kv">完整紀錄雜湊 · 各文件雜湊 · 你的數位簽章</div>
    <div class="kv">製程階段 ID:${STAGE.id}${STAGE.prev?(' · 前一段參考:'+STAGE.prev+' 區塊'):' · 本鏈第一段(無前棒)'}</div></div>

  <div class="callout key"><div class="t">🛡 平台拿到後</div>能驗章確認是你送的,但讀不到任何 🔒 欄位;只會用 🌐 明文組裝 DPP。送出後由<b>平台執行區塊鏈上鏈</b>(mint / 錨定)。</div>

  <div class="row">
    <button class="btn ghost" onclick="go('preprocess')">看完整 JSON ▾</button>
  </div>
  <div class="row" style="margin-top:14px">
    <button class="btn" onclick="go('disclose')">← 回去改揭露設定</button>
    <span class="right"></span>
    <button class="btn pri" onclick="askSign()">🔏 簽署並送出</button>
  </div>`;
}

function vChain(){
  if(!state.submitted){
    return `${stepper('chain')}<h1>上鏈狀態</h1><div class="callout info"><div class="t">🛈 尚未送出</div>請先在「加密與送出」完成簽署。<div class="row" style="margin-top:8px"><button class="btn" onclick="go('boundary')">前往送出 →</button></div></div>`;
  }
  const c=state.chain; const waiting=!c;   /* 平台尚未回填 block(由平台執行上鏈) */
  const step=state.chainAnim?state.chainAnim.step:(waiting?2:5);
  const li=(k,label)=>`<li class="${step>k?'done':(step===k?'cur':'')}"><span class="dot">${step>k?'✓':k+1}</span>${label}</li>`;
  return `${stepper('chain')}<h1>上鏈狀態 · ${STAGE.label} ${state.policy.order}</h1>
  <ul class="timeline">
    ${li(0,'本地簽署 / 加密 / 雜湊')}
    ${li(1,'送回雲端平台')}
    ${li(2,'平台驗章')}
    ${li(3,'平台 Mint ERC-721 區塊')}
    ${li(4,'錨定完成(接續前一段)')}
  </ul>
  ${(!waiting && step>=5)?`<div class="card">
    <div class="kv">Token ID:<b>#${c.tokenId}</b> · 鏈上序位 index ${c.index}</div>
    <div class="kv">交易雜湊:${c.real&&c.txHash?`<a href="https://sepolia.etherscan.io/tx/${c.txHash}" target="_blank" rel="noopener">${c.txHash} ↗</a>`:`${c.txHash||'(模擬)'} <span class="pill">${c.real===false?'🧪 模擬':'在區塊瀏覽器查看 ↗'}</span>`}</div>
    <div class="kv">時間戳:${c.timestamp}</div>
    <div class="kv">Metadata 雜湊:${c.metadataHash}</div>
    ${c.real?`<div class="kv">tokenURI:${c.gatewayURL?`<a href="${c.gatewayURL}" target="_blank" rel="noopener">${c.tokenURI}</a>`:(c.tokenURI||'')}</div>
    <div class="kv">前一段 token:${c.prevTokenId||'(無 · 本鏈第一段)'}</div>`
    :`<div class="kv">本段雜湊 hash:${c.hash}</div>
    <div class="kv">前一段參考 prevHash:${c.prevHash||'(無 · 本鏈第一段)'}</div>`}
    <div class="kv" style="color:var(--good)">狀態:🟢 ${c.real?'已上鏈 Sepolia':'已上鏈(模擬)'} · 已送回平台</div>
    <div class="callout jewel" style="margin-top:10px"><div class="t">🔒 你保留的</div>本批加密欄位的鑰匙(在 TEE)。密文平台讀不到;是否釋出、給誰解密由<b>平台</b>統一控管,工廠端不在此決定。</div>
    <div class="row"><span class="right"></span><button class="btn pri" onclick="go('home')">完成 · 回首頁</button></div>
  </div>`:`<div class="callout info"><div class="t">⏳ 已送出 · 等待平台上鏈</div>本廠已將「簽署 + 加密邊界」送回平台;<b>區塊鏈(mint / 錨定)由平台執行</b>,完成後此處會顯示 Token 與 hash。請保持 <code>platform.html</code> 開啟。</div>`}`;
}

function vSimple(title,body){return `<h1>${title}</h1>${body}`;}

/* ---------- 驗證請求 / 金鑰放行(平台向本廠申請解密加密欄位)---------- */
function myKeyReqs(){ return (Bus.get('keyRequests')||[]).filter(r=>r.stage===STAGE.id); }
function pendingKeyReqs(){ return myKeyReqs().filter(r=>r.status==='pending'); }
function decideKey(key,decision){
  const reqs=Bus.get('keyRequests')||[];
  const r=reqs.find(x=>x.stage===STAGE.id && x.key===key);
  if(!r){ toast('找不到該請求'); return; }
  r.status=decision; r.decidedTs=nowUTC();
  Bus.set('keyRequests',reqs);
  toast(decision==='approved'?'🔓 已放行:平台法規端可解密此欄位':'⛔ 已拒絕:維持不可解密');
  render();
}
function vVerify(){
  const reqs=myKeyReqs();
  const labelOf=k=>{const f=FIELDS.find(x=>x.key===k);return f?f.label:k;};
  const rows=reqs.map(r=>{
    let action;
    if(r.status==='approved') action=`<span class="chip">✅ 已放行</span> <button class="btn ghost" onclick="decideKey('${r.key}','denied')">收回</button>`;
    else if(r.status==='denied') action=`<span class="chip warn">⛔ 已拒絕</span> <button class="btn ghost" onclick="decideKey('${r.key}','approved')">改為放行</button>`;
    else action=`<button class="btn pri" onclick="decideKey('${r.key}','approved')">放行解密</button> <button class="btn warn" onclick="decideKey('${r.key}','denied')">拒絕</button>`;
    return `<tr><td>🔒 ${labelOf(r.key)}</td><td class="fval">${r.key}</td><td class="fval">${r.ts||''}</td><td>${action}</td></tr>`;
  }).join('');
  return `<h1>驗證請求 · 金鑰放行</h1>
  <p>平台(供法規查驗)針對本廠<b>加密上傳</b>的欄位申請解密鑰匙。可逐項<b>放行</b>或<b>拒絕</b>;放行後,平台「法規機關」視角才看得到該欄位原始值(對應工作流②)。</p>
  ${reqs.length?`<table class="ftable"><tr><th>欄位</th><th>key</th><th>申請時間</th><th>決定</th></tr>${rows}</table>`
    :`<div class="card" style="border-left:4px solid var(--line)"><div class="row"><b>⚪ 目前沒有待處理的驗證請求</b></div>
       <p style="margin:6px 0 0">當平台在其「金鑰 / 驗證請求」頁向本廠申請某個加密欄位的解密鑰匙時,這裡會出現待放行項目、側欄通知燈也會亮。</p></div>`}
  <div class="callout jewel"><div class="t">🔓 解密同意權在本廠</div>資料一律加密送回平台;密文要能被解讀須經本廠在此放行。拒絕則平台 / 法規端維持看不到原始值。</div>`;
}

function render(){
  renderTopbar(); renderNav();
  const v=state.view;
  const map={home:vHome,inbox:vInbox,disclose:vDisclose,preprocess:vPreprocess,boundary:vBoundary,chain:vChain,verify:vVerify};
  let html;
  if(map[v]) html=map[v]();
  else if(v==='settings') html=vSimple('設定',`<div class="card">
    <div class="kv">Endpoint 身分(DID):did:web:${STAGE.id}-factory.example</div>
    <div class="kv">工廠 ID:${STAGE.factoryId}</div>
    <div class="kv">錢包位址:0x${simpleHash(STAGE.id)}…</div>
    <div class="kv">TEE 連線:🟢 已連線</div>
    <div class="kv">資料匯流排:${state.policyIsReal?'🔗 平台已連線':'🔌 離線(內建範例政策)'}</div>
    <div class="kv">部署模式:on-prem(Windows 服務 / Linux daemon)</div>
    <div class="kv">本廠權限:決定各欄位「公開 / 加密」,並對平台的解密申請逐項放行 / 拒絕(見「驗證請求」);上鏈與否由平台控管</div>
    <div class="kv">語言:繁體中文</div>
    <div class="row" style="margin-top:10px"><button class="btn warn" onclick="resetSubmission()">重置本廠提交(Demo)</button></div>
  </div>`);
  else html=vSimple('—','');
  document.getElementById('main').innerHTML=html;
}

/* ---------- 互動 ---------- */
function setDisc(id,val){
  const f=FIELDS.find(x=>x.id===id);
  if(f.disclosure===val) return;
  if(val==='public' && f.sensitive){
    openModal(`<h3>⚠ 公開機密欄位?</h3>
      <p>「<b>${f.label}</b>」被標為商業機密(皇冠寶石)。公開後任何人都看得到,且上鏈後不可收回明文。確定嗎?</p>
      <div class="row"><span class="right"></span><button class="btn" onclick="closeModal()">取消</button>
      <button class="btn warn" onclick="closeModal();doSetDisc('${id}','public')">仍要公開</button></div>`);
    return;
  }
  doSetDisc(id,val);
}
function doSetDisc(id,val){FIELDS.find(x=>x.id===id).disclosure=val; state.preprocessed=false; render();}
function applyRec(){FIELDS.forEach(f=>f.disclosure=f.rec); state.preprocessed=false; toast('已套用建議設定'); render();}

function runPre(){
  const bar=document.getElementById('preBar'); const st=document.getElementById('preState');
  let p=0; if(st)st.textContent='正在正規化欄位…';
  const t=setInterval(()=>{p+=20; if(bar)bar.style.width=p+'%';
    if(p>=100){clearInterval(t); state.preprocessed=true; render();}},150);
}

function askSign(){
  openModal(`<h3>🔏 簽署並送出</h3>
    <p>你即將用<b>工廠錢包</b>簽署並送回本批封包給平台。送回後由<b>平台上鏈</b>,<b>內容不可修改</b>。</p>
    <p class="vis">🌐 公開 ${pubCount()} · 🔒 加密 ${priCount()}</p>
    <div class="row"><span class="right"></span><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn pri" onclick="closeModal();doSign()">確認簽署(👛 錢包)</button></div>`);
}
function doSign(){
  const fields=requiredFields().map(f=>({key:f.key,label:f.label,grp:f.grp,kind:f.kind,sensitive:f.sensitive,
    disclosure:f.disclosure,
    val: f.disclosure==='public'? f.val : null,
    cipher: f.disclosure==='private'? ('ENC(🔒 '+simpleHash(f.key+f.val).slice(0,6)+'…)') : null}));
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
  const t=setInterval(()=>{ if(state.chainAnim&&state.chainAnim.step<2){state.chainAnim.step++; render();} else {clearInterval(t);} },650);
}

function resetSubmission(){Bus.del('submission:'+STAGE.id); state.submitted=false; state.submission=null; state.chain=null; state.preprocessed=false; FIELDS.forEach(f=>f.disclosure=f.rec); toast('已重置本廠提交'); go('home');}

function showPolicyJson(){
  const p=state.policy;
  openModal(`<h3>政策 JSON</h3><pre class="code">${JSON.stringify({order:p.order,issuer:p.issuer,signature:p.sig,retention_years:p.retentionYears,stage:STAGE.id,features:requiredKeys()},null,2).replace(/</g,'&lt;')}</pre><div class="row"><span class="right"></span><button class="btn" onclick="closeModal()">關閉</button></div>`);
}

/* ---------- modal / toast ---------- */
function openModal(html){document.getElementById('modalBody').innerHTML=html;document.getElementById('modal').classList.remove('hidden');}
function closeModal(){document.getElementById('modal').classList.add('hidden');}
function toast(msg){
  const d=document.createElement('div');
  d.textContent=msg;
  d.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#20211c;color:#fff;padding:10px 18px;border-radius:999px;font-size:13.5px;z-index:80;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:90vw';
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
        if(!wasReal) toast('📥 收到本廠收集政策 '+val.id+' · 請完成揭露決策並上傳');
        render();
      }
    }
  }
  /* 平台上鏈後把 block 回填到本廠的 submission → 顯示 Token / hash */
  if(key==='submission:'+STAGE.id && val && val.block){
    state.submission=val; state.chain=val.block; state.submitted=true;
    toast('⛓ 平台已完成上鏈 · Token #'+val.block.tokenId);
    if(state.chainAnim){
      const t=setInterval(()=>{state.chainAnim.step++; render(); if(state.chainAnim.step>=5){clearInterval(t); state.chainAnim=null;}},350);
    } else { render(); }
  }
  /* 平台向本廠申請解密某加密欄位 → 亮通知燈、提示去「驗證請求」放行 */
  if(key==='keyRequests'){
    const pend=(val||[]).filter(r=>r.stage===STAGE.id && r.status==='pending').length;
    if(pend) toast('🔓 平台申請解密本廠 '+pend+' 個欄位 · 請至「驗證請求」放行');
    render();
  }
  if(key==='reset'){ Bus.del('submission:'+STAGE.id); state.submitted=false; state.submission=null; state.chain=null; state.preprocessed=false; FIELDS.forEach(f=>f.disclosure=f.rec); render(); }
});

render();
