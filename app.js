(()=>{
'use strict';
const C=window.JASVI_PWA_CONFIG;
const root=document.getElementById('root');
const state={token:sessionStorage.getItem('jasvi.token')||localStorage.getItem('jasvi.token')||'',remember:!!localStorage.getItem('jasvi.token'),user:null,permissions:[],tab:'dashboard',loading:false,online:navigator.onLine,installHint:false,refreshKey:0,sales:{page:0,q:'',status:'',rows:[],metrics:null,totalRows:0},bank:{batches:[],batch:null,transactions:[],metrics:null,q:'',status:''},dashboard:null,importTab:'history',lastError:''};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const rupee=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n||0));
const shortMoney=n=>{n=Number(n||0);if(Math.abs(n)>=1e7)return '₹'+(n/1e7).toFixed(2)+'Cr';if(Math.abs(n)>=1e5)return '₹'+(n/1e5).toFixed(2)+'L';if(Math.abs(n)>=1e3)return '₹'+(n/1e3).toFixed(1)+'K';return rupee(n)};
const dateOnly=v=>String(v||'').slice(0,10);
const badgeClass=s=>{s=String(s||'').toUpperCase();if(/PAID|MATCHED|COMPLETED|APPROVED|ACTIVE|SUCCESS|RECONCILED/.test(s))return'green';if(/PENDING|OPEN|REVIEW|PROCESS|DUE/.test(s))return'orange';if(/FAIL|REJECT|CANCEL|OVERDUE|ERROR/.test(s))return'red';if(/PARTIAL|SUGGEST/.test(s))return'blue';return'purple'};
function svg(name){const p={home:'<path d="M3 11.5 12 4l9 7.5v8.5a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',sales:'<path d="M6 2h9l3 3v17H6z"/><path d="M9 9h6M9 13h6M9 17h4"/>',bank:'<path d="M3 9h18M5 9v9m4-9v9m6-9v9m4-9v9M3 20h18M12 3l9 4H3z"/>',upload:'<path d="M12 16V4m0 0-4 4m4-4 4 4M4 15v5h16v-5"/>',more:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',refresh:'<path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2L4 11m2 4a7 7 0 0 0 12 2l2-4"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>'};return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[name]||p.more}</svg>`}
function tokenStore(token,remember){state.token=token||'';sessionStorage.removeItem('jasvi.token');localStorage.removeItem('jasvi.token');if(token)(remember?localStorage:sessionStorage).setItem('jasvi.token',token)}
async function api(path,{method='GET',body,auth=true,timeout=C.requestTimeoutMs,headers={}}={}){const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),timeout);try{const h={'Accept':'application/json',...headers};if(body!==undefined)h['Content-Type']='application/json';if(auth&&state.token)h['Authorization']='Bearer '+state.token;const r=await fetch(C.apiBaseUrl+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body),signal:ctl.signal,mode:'cors',credentials:'omit'});const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}if(r.status===401){tokenStore('',false);throw Object.assign(new Error(typeof data==='string'?data:'Session expired'),{status:401})}if(!r.ok)throw Object.assign(new Error((data&&data.message)||String(data||r.statusText)),{status:r.status,data});return data}catch(e){if(e.name==='AbortError')throw new Error('Request timed out');if(e instanceof TypeError){throw new Error('Unable to reach ERP from this web app. Check internet and whether the Oracle API allows this PWA domain (CORS).')}throw e}finally{clearTimeout(timer)}}
function cacheSet(k,v){try{localStorage.setItem('jasvi.cache.'+k,JSON.stringify({at:Date.now(),v}))}catch{}}
function cacheGet(k){try{return JSON.parse(localStorage.getItem('jasvi.cache.'+k)||'null')}catch{return null}}
function dialog({title='Notice',message='',kind='normal',confirm='OK',cancel='',onConfirm=()=>{}}){const el=document.createElement('div');el.className='dialog-backdrop';el.innerHTML=`<div class="dialog"><h3>${esc(title)}</h3><p>${esc(message)}</p><div class="dialog-actions">${cancel?`<button data-cancel>${esc(cancel)}</button>`:''}<button class="${kind==='danger'?'danger':'confirm'}" data-ok>${esc(confirm)}</button></div></div>`;el.querySelector('[data-ok]').onclick=()=>{el.remove();onConfirm()};el.querySelector('[data-cancel]')?.addEventListener('click',()=>el.remove());document.body.appendChild(el)}
function sheet(title,actions=[]){const el=document.createElement('div');el.className='sheet-backdrop';el.innerHTML=`<div class="sheet"><div class="handle"></div><h3>${esc(title)}</h3>${actions.map((a,i)=>`<button class="action ${a.danger?'danger':''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>`;el.onclick=e=>{if(e.target===el)el.remove()};el.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const a=actions[+b.dataset.i];el.remove();a.run?.()});document.body.appendChild(el)}
function layout(content,{title,subtitle='',plus=false,refresh=false}={}){const initials=(state.user?.fullName||state.user?.username||'JI').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();return `<div class="app"><main class="screen"><div class="topbar"><button class="icon-btn" id="menuBtn" aria-label="Menu">${svg('menu')}</button><div class="title"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${plus?'<button class="plus-btn" id="plusBtn" aria-label="Add">+</button>':`<div class="avatar">${esc(initials)}</div>`}</div><div class="status-line"><span class="dot ${state.online?'':'offline'}"></span><span>${state.online?'Online':'Offline'} • ${esc(C.environment)} • ${esc(C.version)}</span></div>${installBanner()}${content}</main>${refresh?`<button class="fab-refresh" id="refreshFab" aria-label="Refresh">${svg('refresh')}</button>`:''}${bottomNav()}</div>`}
function installBanner(){const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;if(standalone||sessionStorage.getItem('hide.install'))return'';return `<div class="install-banner">📲 <span>Add Jasvi ERP to your iPhone Home Screen for app-like launch.</span><button id="installHelp">How</button></div>`}
function bottomNav(){const items=[['dashboard','Dashboard','home'],['sales','Sales','sales'],['bank','Bank Statement','bank'],['import','Import','upload'],['more','More','more']];return `<nav class="bottom-nav">${items.map(([id,l,ic])=>`<button class="nav-item ${state.tab===id?'active':''}" data-tab="${id}">${svg(ic)}<span>${esc(l)}</span></button>`).join('')}</nav>`}
function bindCommon(){document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>navigate(b.dataset.tab));document.getElementById('menuBtn')?.addEventListener('click',()=>sheet('Jasvi Industries',[{label:'Dashboard',run:()=>navigate('dashboard')},{label:'Global Search',run:()=>openGlobalSearch()},{label:'Refresh current view',run:()=>loadCurrent(true)},{label:'Sign out',danger:true,run:logout}]));document.getElementById('installHelp')?.addEventListener('click',()=>dialog({title:'Add to Home Screen',message:'On iPhone Safari: tap Share, choose Add to Home Screen, then tap Add. After that you can open Jasvi ERP directly from the Home Screen.',confirm:'Got it',onConfirm:()=>{sessionStorage.setItem('hide.install','1')}}));document.getElementById('refreshFab')?.addEventListener('click',()=>loadCurrent(true))}
async function loginScreen(message=''){root.innerHTML=`<div class="login-wrap"><div class="login-card"><div class="brand"><div class="brand-mark">JI</div><div><h1>Jasvi Industries</h1><p>ERP Mobile • ${esc(C.environment)}</p></div></div><form id="loginForm"><div class="field"><label>Username or Email</label><input id="identity" autocomplete="username" required></div><div class="field"><label>Password</label><input id="password" type="password" autocomplete="current-password" required></div><label style="display:flex;gap:8px;align-items:center;font-size:12px;color:var(--muted);margin:8px 0"><input id="remember" type="checkbox" style="width:auto"> Keep me signed in on this iPhone</label><div id="loginError" class="error-text">${esc(message)}</div><button class="primary" type="submit">Sign in</button></form><p class="login-note">This UAT PWA connects to the same Jasvi ERP authentication endpoint as Mobile. Browser access requires the Oracle API to allow the PWA origin.</p></div></div>`;document.getElementById('loginForm').onsubmit=async e=>{e.preventDefault();const identity=document.getElementById('identity').value.trim(),password=document.getElementById('password').value,remember=document.getElementById('remember').checked,err=document.getElementById('loginError');err.textContent='Signing in…';try{const r=await api('/api/auth/login',{method:'POST',body:{identity,password},auth:false});if(!r?.success)throw new Error(r?.message||'Login failed');if(r.mfaRequired){mfaScreen(r.challengeId,r.maskedDestination,remember);return}tokenStore(r.accessToken,remember);state.user=r.user||null;await bootstrap();navigate('dashboard')}catch(ex){err.textContent=ex.message}}}
function mfaScreen(challengeId,masked,remember){root.innerHTML=`<div class="login-wrap"><div class="login-card"><div class="brand"><div class="brand-mark">✓</div><div><h1>Verify login</h1><p>${esc(masked||'Enter your authentication code')}</p></div></div><form id="mfaForm"><div class="field"><label>One-time code</label><input id="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required></div><div id="mfaError" class="error-text"></div><button class="primary" type="submit">Verify</button><button class="secondary" type="button" id="backLogin">Back</button></form></div></div>`;document.getElementById('backLogin').onclick=()=>loginScreen();document.getElementById('mfaForm').onsubmit=async e=>{e.preventDefault();const err=document.getElementById('mfaError');try{const r=await api('/api/auth/login/mfa/complete',{method:'POST',body:{challengeId,otp:document.getElementById('otp').value.trim()},auth:false});if(!r?.success)throw new Error(r?.message||'Verification failed');tokenStore(r.accessToken,remember);state.user=r.user||null;await bootstrap();navigate('dashboard')}catch(ex){err.textContent=ex.message}}}
async function bootstrap(){try{const [p,perms]=await Promise.all([api('/api/profile'),api('/api/auth/effective-permissions')]);state.user=p;state.permissions=perms||[]}catch(e){if(e.status===401)throw e}}
function can(module,action){return state.permissions.some(p=>String(p.module).toUpperCase()===module&&String(p.action).toUpperCase()===action)}
function navigate(tab){state.tab=tab;history.replaceState(null,'','#'+tab);render();loadCurrent(false)}
function render(){if(!state.token){loginScreen();return}if(state.tab==='dashboard')renderDashboard();else if(state.tab==='sales')renderSales();else if(state.tab==='bank')renderBank();else if(state.tab==='import')renderImport();else renderMore();bindCommon()}
async function loadCurrent(force){if(!state.token)return;if(state.tab==='dashboard')await loadDashboard(force);if(state.tab==='sales')await loadSales(force);if(state.tab==='bank')await loadBank(force);if(state.tab==='import')await loadImportHistory(force)}
function renderDashboard(){const d=state.dashboard,s=d?.snapshot||{},recent=d?.recent||[],acts=d?.activities||[];root.innerHTML=layout(`${!d?'<div class="loading"><strong>Loading dashboard…</strong>Connecting to ERP</div>':`<div class="search" id="globalSearch">${svg('search')}<input placeholder="Search ERP records…" readonly></div><div class="kpis cols4"><div class="kpi green"><div class="label">Sales</div><div class="value">${shortMoney(s.salesValue)}</div></div><div class="kpi blue"><div class="label">Receivable</div><div class="value">${shortMoney(s.receivables)}</div></div><div class="kpi orange"><div class="label">Payable</div><div class="value">${shortMoney(s.payables)}</div></div><div class="kpi purple"><div class="label">Bank</div><div class="value">${shortMoney(s.cash)}</div></div><div class="section-head"><h2>Recent Documents</h2><button data-tab="sales">View Sales</button></div><div class="list">${recent.slice(0,6).map(r=>recordCard(r.number,r.party||r.type,r.amount,r.date,r.type,'Module')).join('')||'<div class="empty"><strong>No recent documents</strong>Nothing to display yet.</div>'}</div><div class="section-head"><h2>Follow-ups</h2><button id="openReminders">Reminders</button></div><div class="list">${acts.slice(0,4).map(a=>`<div class="card"><strong style="font-size:12px">${esc(a.title||a.category)}</strong><div class="meta" style="margin-top:3px">${esc(a.message||'')}</div></div>`).join('')||'<div class="empty"><strong>No follow-ups</strong>No active reminders.</div>'}</div>`}`,{title:'Dashboard',subtitle:state.user?.fullName||state.user?.username||'Business overview',refresh:true});bindCommon();document.getElementById('globalSearch')?.addEventListener('click',openGlobalSearch);document.getElementById('openReminders')?.addEventListener('click',()=>dialog({title:'Reminders',message:'Reminder list parity is available from the existing Insights API and will be surfaced under More in the next PWA parity pass.'}))}
async function loadDashboard(force){if(!force){const c=cacheGet('dashboard');if(c&&!state.dashboard){state.dashboard=c.v;renderDashboard()}}try{const d=await api('/api/insights/dashboard?period='+encodeURIComponent('This Month'));state.dashboard=d;cacheSet('dashboard',d);renderDashboard()}catch(e){if(!state.dashboard)dialog({title:'Dashboard unavailable',message:e.message})}}
function recordCard(title,sub,amount,meta,status,statusLabel='Status',extra=''){return `<div class="card record"><div class="record-icon">▤</div><div><h3>${esc(title||'Record')}</h3><div class="sub">${esc(sub||'')}</div><div class="meta">${esc(dateOnly(meta))}${extra?` • ${esc(extra)}`:''}</div></div><div><div class="amount">${typeof amount==='number'?rupee(amount):esc(amount||'')}</div>${status?`<div class="badge ${badgeClass(status)}">${esc(status)}</div>`:''}</div></div>`}
function renderSales(){const s=state.sales,m=s.metrics||{};root.innerHTML=layout(`<div class="kpis"><div class="kpi green"><div class="label">Today</div><div class="value">${shortMoney(m.todaySales)}</div></div><div class="kpi orange"><div class="label">Pending</div><div class="value">${shortMoney(m.pendingBalance)}</div></div></div><div class="search">${svg('search')}<input id="salesQ" value="${esc(s.q)}" placeholder="Search invoices, customer…"><button class="more-btn" id="salesGo">⌕</button></div><div class="filters"><button class="chip ${!s.status?'active':''}" data-status="">All</button><button class="chip ${s.status==='PENDING'?'active':''}" data-status="PENDING">Pending</button><button class="chip ${s.status==='PAID'?'active':''}" data-status="PAID">Paid</button><button class="chip ${s.status==='PARTIAL'?'active':''}" data-status="PARTIAL">Partial</button></div><div class="list" id="salesList">${s.rows.length?s.rows.map(r=>recordCard(r.invoiceNo,r.customer?.name||r.customerName||'',Number(r.totalAmount??0),r.invoiceDate,r.paymentStatus||r.status||'', 'Status',`Paid ${rupee(r.paidAmount||0)} • Due ${rupee(Math.max(0,Number(r.totalAmount||0)-Number(r.paidAmount||0)))}`)).join(''):'<div class="loading"><strong>Loading sales…</strong>Fetching records</div>'}</div>`,{title:'Sales',subtitle:`${s.totalRows||0} records`,plus:can('SALES','CREATE'),refresh:true});bindCommon();const search=()=>{state.sales.q=document.getElementById('salesQ').value.trim();state.sales.page=0;loadSales(true)};document.getElementById('salesGo').onclick=search;document.getElementById('salesQ').onkeydown=e=>{if(e.key==='Enter')search()};document.querySelectorAll('[data-status]').forEach(b=>b.onclick=()=>{state.sales.status=b.dataset.status;loadSales(true)});document.getElementById('plusBtn')?.addEventListener('click',()=>dialog({title:'New Sale',message:'The native Mobile create-sale workflow remains server-authoritative. Full web create/edit parity will be added after UAT read/action validation.'}))}
async function loadSales(force){try{const q=new URLSearchParams({page:String(state.sales.page),size:String(C.pageSize),q:state.sales.q,status:state.sales.status});const d=await api('/api/operations/sales/page?'+q);state.sales.rows=d.rows||[];state.sales.metrics=d.metrics||null;state.sales.totalRows=d.totalRows||0;cacheSet('sales',d);renderSales()}catch(e){const c=cacheGet('sales');if(c){state.sales.rows=c.v.rows||[];state.sales.metrics=c.v.metrics||null;state.sales.totalRows=c.v.totalRows||0;renderSales()}else dialog({title:'Sales unavailable',message:e.message})}}
function renderBank(){const b=state.bank;if(!b.batch){root.innerHTML=layout(`<div class="search">${svg('search')}<input id="bankBatchQ" value="${esc(b.q)}" placeholder="Search bank imports…"><button class="more-btn" id="bankBatchGo">⌕</button></div><div class="list">${b.batches.length?b.batches.map(x=>`<div class="card record bank-batch" data-id="${x.id}"><div class="record-icon">▦</div><div><h3>${esc(x.bankName||'Bank Statement')}</h3><div class="sub">${esc(x.bankAccount||x.sourceFileName)}</div><div class="meta">${esc(x.transactionCount)} transactions • ${esc(x.reconciledCount)} reconciled • ${esc(dateOnly(x.importedAt))}</div></div><div><div class="amount">${esc(Math.round(x.reconciliationPercent||0))}%</div><div class="badge ${badgeClass(x.status)}">${esc(x.status||'Imported')}</div></div></div>`).join(''):'<div class="loading"><strong>Loading bank statements…</strong>Fetching imports</div>'}</div>`,{title:'Bank Statement',subtitle:'Imported statements',plus:true,refresh:true});bindCommon();document.getElementById('bankBatchGo').onclick=()=>{state.bank.q=document.getElementById('bankBatchQ').value.trim();loadBank(true)};document.querySelectorAll('.bank-batch').forEach(el=>el.onclick=()=>{state.bank.batch=state.bank.batches.find(x=>String(x.id)===el.dataset.id);loadBankTransactions(true)});document.getElementById('plusBtn').onclick=()=>navigate('import');return}
const m=b.metrics||{},rows=b.transactions||[];root.innerHTML=layout(`<div class="kpis"><div class="kpi blue"><div class="label">Transactions</div><div class="value">${m.total||rows.length}</div></div><div class="kpi orange"><div class="label">Unmatched</div><div class="value">${m.unmatched||0}</div></div></div><div class="search">${svg('search')}<input id="bankTxnQ" value="${esc(b.q)}" placeholder="Search narration, reference…"><button class="more-btn" id="bankTxnGo">⌕</button></div><div class="filters"><button class="chip" id="backBatches">← Imports</button><button class="chip ${!b.status?'active':''}" data-bstatus="">All</button><button class="chip ${b.status==='MATCHED'?'active':''}" data-bstatus="MATCHED">Matched</button><button class="chip ${b.status==='PENDING'?'active':''}" data-bstatus="PENDING">Pending</button></div><div class="list">${rows.length?rows.map(t=>`<div class="card txn"><div class="arr ${Number(t.credit)>0?'in':'out'}">${Number(t.credit)>0?'↓':'↑'}</div><div><div class="narr">${esc(t.description||'Transaction')}</div><div class="ref">${esc(dateOnly(t.transactionDate))} • ${esc(t.reference||'')}</div><div class="badge ${badgeClass(t.status)}">${esc(t.status||'Pending')}</div></div><div><div class="money" style="color:${Number(t.credit)>0?'var(--green)':'var(--red)'}">${Number(t.credit)>0?'+ ':'- '}${rupee(Number(t.credit)>0?t.credit:t.debit)}</div><div class="balance">Bal ${rupee(t.balance)}</div></div></div>`).join(''):'<div class="empty"><strong>No transactions</strong>No rows match this view.</div>'}</div>`,{title:'Bank Statement',subtitle:`${b.batch.bankName} • ${b.batch.bankAccount}`,refresh:true});bindCommon();document.getElementById('backBatches').onclick=()=>{state.bank.batch=null;state.bank.transactions=[];renderBank()};document.getElementById('bankTxnGo').onclick=()=>{state.bank.q=document.getElementById('bankTxnQ').value.trim();loadBankTransactions(true)};document.querySelectorAll('[data-bstatus]').forEach(el=>el.onclick=()=>{state.bank.status=el.dataset.bstatus;loadBankTransactions(true)})}
async function loadBank(force){if(state.bank.batch)return loadBankTransactions(force);try{const q=new URLSearchParams({page:'0',size:'50',q:state.bank.q});const d=await api('/api/bank-statements/imports/page?'+q);state.bank.batches=d.rows||[];cacheSet('bank.batches',d);renderBank()}catch(e){const c=cacheGet('bank.batches');if(c){state.bank.batches=c.v.rows||[];renderBank()}else dialog({title:'Bank Statement unavailable',message:e.message})}}
async function loadBankTransactions(force){if(!state.bank.batch)return;try{const q=new URLSearchParams({page:'0',size:'100',q:state.bank.q,status:state.bank.status,direction:'ALL'});const d=await api(`/api/bank-statements/imports/${state.bank.batch.id}/page?`+q);state.bank.transactions=d.rows||[];state.bank.metrics=d.metrics||null;renderBank()}catch(e){dialog({title:'Transactions unavailable',message:e.message})}}
function renderImport(){root.innerHTML=layout(`<div class="kpis cols4"><div class="kpi purple"><div class="label">Mode</div><div class="value">UAT</div></div><div class="kpi green"><div class="label">Safety</div><div class="value">Dry Run</div></div><div class="kpi blue"><div class="label">CSV</div><div class="value">Ready</div></div><div class="kpi orange"><div class="label">Writes</div><div class="value">Confirm</div></div></div><div class="import-tabs"><button class="${state.importTab==='history'?'active':''}" data-itab="history">Import History</button><button class="${state.importTab==='new'?'active':''}" data-itab="new">New Import</button></div><div id="importBody">${state.importTab==='history'?importHistoryHtml():newImportHtml()}</div>`,{title:'Import',subtitle:'Data Import & Sync',plus:true,refresh:true});bindCommon();document.querySelectorAll('[data-itab]').forEach(b=>b.onclick=()=>{state.importTab=b.dataset.itab;renderImport()});document.getElementById('plusBtn').onclick=()=>{state.importTab='new';renderImport()};bindImportBody()}
function importHistoryHtml(){return `<div class="list">${state.bank.batches.length?state.bank.batches.slice(0,12).map(x=>`<div class="card record"><div class="record-icon">⇧</div><div><h3>${esc(x.sourceFileName||'Bank Statement Import')}</h3><div class="sub">${esc(x.bankName)} • ${esc(x.bankAccount)}</div><div class="meta">${esc(x.transactionCount)} rows • ${esc(x.reconciledCount)} reconciled • ${esc(dateOnly(x.importedAt))}</div></div><div><div class="badge ${badgeClass(x.status)}">${esc(x.status||'Imported')}</div></div></div>`).join(''):'<div class="empty"><strong>No import history</strong>Bank statement imports will appear here.</div>'}</div>`}
function newImportHtml(){return `<div class="filebox"><strong>Bank Statement CSV</strong><div class="meta" style="margin-top:5px">Columns supported: transaction_date, description, reference, debit, credit, balance.</div><input type="file" id="bankCsv" accept=".csv,text/csv"></div><div class="field"><label>Bank Name *</label><input id="bankName" placeholder="e.g. HDFC Bank"></div><div class="field"><label>Bank Account *</label><input id="bankAccount" placeholder="e.g. 1234"></div><div class="field"><label>Account Holder</label><input id="bankHolder" value="Jasvi Industries"></div><div class="field"><label>Currency</label><input id="bankCurrency" value="INR"></div><label style="display:flex;gap:8px;align-items:center;font-size:12px;color:var(--muted)"><input id="dryRun" type="checkbox" checked style="width:auto"> Dry run first (recommended)</label><button class="primary" id="runImport">Validate / Import</button><div id="importResult"></div>`}
function bindImportBody(){if(state.importTab==='history')return;document.getElementById('runImport').onclick=async()=>{const f=document.getElementById('bankCsv').files[0],bankName=document.getElementById('bankName').value.trim(),bankAccount=document.getElementById('bankAccount').value.trim(),holder=document.getElementById('bankHolder').value.trim(),currency=document.getElementById('bankCurrency').value.trim()||'INR',dry=document.getElementById('dryRun').checked,res=document.getElementById('importResult');if(!f||!bankName||!bankAccount){res.innerHTML='<div class="notice" style="color:var(--red)">Select a CSV file and enter Bank Name + Account.</div>';return}const execute=async()=>{res.innerHTML='<div class="loading"><strong>Processing import…</strong>Please wait</div>';try{const text=await f.text(),rows=parseCsv(text).map((r,i)=>toBankRow(r,i));if(!rows.length)throw new Error('CSV has no data rows');const dates=rows.map(r=>r.transactionDate).filter(Boolean).sort();const req={bankName,bankAccount,accountHolder:holder,statementFrom:dates[0]||'',statementTo:dates[dates.length-1]||'',currency,openingBalance:null,closingBalance:null,sourceFingerprint:hashText(f.name+'|'+text),sourceFileName:f.name,sourceCsv:text,importedBy:state.user?.username||'PWA',dryRun:dry,rows};const out=await api('/api/bank-statements/imports',{method:'POST',body:req});res.innerHTML=`<div class="notice"><strong>${dry?'Dry run complete':'Import complete'}</strong>&nbsp; ${esc(out.importedRows||0)} imported • ${esc(out.duplicateRows||0)} duplicate${out.alreadyImported?' • Already imported':''}</div>`;await loadBank(true)}catch(e){res.innerHTML=`<div class="notice" style="color:var(--red)">${esc(e.message)}</div>`}};if(dry)execute();else dialog({title:'Import Bank Statement?',message:`This will write ${f.name} to UAT ERP. Continue only after a successful Dry Run.`,confirm:'Import',cancel:'Cancel',onConfirm:execute})}}
function parseCsv(text){const lines=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const ch=text[i],n=text[i+1];if(ch==='"'){if(q&&n==='"'){cell+='"';i++}else q=!q}else if(ch===','&&!q){row.push(cell);cell=''}else if((ch==='\n'||ch==='\r')&&!q){if(ch==='\r'&&n==='\n')i++;row.push(cell);cell='';if(row.some(x=>x.trim()!==''))lines.push(row);row=[]}else cell+=ch}if(cell||row.length){row.push(cell);lines.push(row)}if(lines.length<2)return[];const headers=lines[0].map(h=>h.trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''));return lines.slice(1).map(cols=>Object.fromEntries(headers.map((h,i)=>[h,(cols[i]||'').trim()]))) }
function toBankRow(r,i){const amount=num(r.amount),dir=String(r.direction||'').toUpperCase(),debit=r.debit!==undefined?num(r.debit):(dir.startsWith('D')||amount<0?Math.abs(amount):0),credit=r.credit!==undefined?num(r.credit):(dir.startsWith('C')||amount>0?Math.abs(amount):0);return{sourceRowNumber:i+2,transactionTimestamp:r.transaction_timestamp||'',transactionDate:r.transaction_date||r.date||'',valueDate:r.value_date||'',description:r.description||r.narration||'',reference:r.reference||r.ref||'',debit,credit,balance:num(r.balance),transactionFingerprint:hashText(i+'|'+JSON.stringify(r))}}
function num(v){return Number(String(v??'0').replace(/,/g,''))||0}function hashText(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)}
async function loadImportHistory(force){try{const d=await api('/api/bank-statements/imports/page?page=0&size=50');state.bank.batches=d.rows||[];renderImport()}catch(e){renderImport()}}
function renderMore(){const mods=[['Global Search','Search across ERP','search'],['Purchases','Purchase register','sales'],['Quotations','Quotation register','sales'],['Returns','Sales & purchase returns','sales'],['Reports','Business reporting','home'],['Profile & Security','Account and session','more']];root.innerHTML=layout(`<div class="more-grid">${mods.map(([t,s,ic],i)=>`<button class="more-tile" data-more="${i}">${svg(ic)}<strong>${esc(t)}</strong><span>${esc(s)}</span></button>`).join('')}</div><div class="section-head"><h2>UAT Compatibility</h2></div><div class="card"><div class="meta">PWA ${esc(C.version)} • API ${esc(C.apiBaseUrl)}</div><div class="meta" style="margin-top:5px">Production switching is disabled until UAT acceptance.</div></div>`,{title:'More',subtitle:'All ERP modules'});bindCommon();document.querySelectorAll('[data-more]').forEach(b=>b.onclick=()=>{const i=+b.dataset.more;if(i===0)openGlobalSearch();else if(i===5)openProfile();else dialog({title:mods[i][0],message:'This module is already available in the native Mobile API contract. Full PWA screen/action parity will be added after the core UAT shell, authentication, Dashboard, Sales, Bank and Import are accepted.'})})}
async function openGlobalSearch(){const el=document.createElement('div');el.className='dialog-backdrop';el.innerHTML=`<div class="dialog" style="max-height:82dvh;overflow:auto"><h3>Global Search</h3><div class="field"><input id="gsQ" placeholder="Invoice, party, payment, reference…" autofocus></div><button class="primary" id="gsGo">Search</button><div id="gsResult"></div><button class="secondary" id="gsClose">Close</button></div>`;document.body.appendChild(el);document.getElementById('gsClose').onclick=()=>el.remove();document.getElementById('gsGo').onclick=async()=>{const q=document.getElementById('gsQ').value.trim(),out=document.getElementById('gsResult');if(!q)return;out.innerHTML='<div class="loading"><strong>Searching…</strong></div>';try{const d=await api('/api/support/search?q='+encodeURIComponent(q));const rows=Array.isArray(d)?d:(d.rows||d.results||[]);out.innerHTML=`<div class="list" style="margin-top:8px">${rows.slice(0,25).map(r=>recordCard(r.number||r.referenceNo||r.title,r.party||r.subtitle||r.module||'',r.amount||'',r.date||'',r.status||r.module||'')).join('')||'<div class="empty"><strong>No results</strong>Try another search.</div>'}</div>`}catch(e){out.innerHTML=`<div class="error-text">${esc(e.message)}</div>`}}}
function openProfile(){dialog({title:'Profile & Security',message:`Signed in as ${state.user?.fullName||state.user?.username||'User'} (${state.user?.role||'ERP role'}). PWA uses the same bearer-token ERP session. Native Face ID quick-unlock is not claimed for the PWA without WebAuthn/passkey server support.`,confirm:'OK'})}
async function logout(){try{await api('/api/auth/logout',{method:'POST'})}catch{}tokenStore('',false);state.user=null;state.permissions=[];loginScreen('Signed out')}
window.addEventListener('online',()=>{state.online=true;render()});window.addEventListener('offline',()=>{state.online=false;render()});window.addEventListener('hashchange',()=>{const t=location.hash.slice(1);if(['dashboard','sales','bank','import','more'].includes(t)){state.tab=t;render();loadCurrent(false)}});
if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js').then(reg=>{reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller){dialog({title:'Update available',message:'A new Jasvi Industries PWA version is ready. Reload to use the latest version.',confirm:'Update now',cancel:'Later',onConfirm:()=>location.reload()})}})})}).catch(()=>{})}
function installPwaUatV2(){
  state.moreScreen=state.moreScreen||'menu';
  state.moreRows=state.moreRows||[];
  state.moreQuery=state.moreQuery||'';
  state.moreLoading=false;

  function detailsMessage(rows){
    return rows.filter(([k,v])=>v!==undefined&&v!==null&&String(v).trim()!=='')
      .map(([k,v])=>`${k}: ${v}`).join('\n');
  }

  async function openCanonical(type,number,format){
    try{
      const r=await fetch(`${C.apiBaseUrl}/api/documents/render?type=${encodeURIComponent(type)}&number=${encodeURIComponent(number)}&format=${encodeURIComponent(format)}`,{
        headers:{Authorization:`Bearer ${state.token}`,Accept:'*/*'},mode:'cors',credentials:'omit'
      });
      if(!r.ok) throw new Error(`Document ${r.status}`);
      const blob=await r.blob();
      const ext=format==='XLSX'?'xlsx':'pdf';
      const fileName=`${type}-${number}.${ext}`.replace(/[^\w.\-]+/g,'_');
      if(navigator.share&&typeof File!=='undefined'){
        try{
          const file=new File([blob],fileName,{type:blob.type||'application/octet-stream'});
          if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:fileName});return;}
        }catch{}
      }
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=fileName;document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),30000);
    }catch(e){dialog({title:`${format} unavailable`,message:e.message});}
  }

  async function showActivity(type,id,title){
    try{
      const rows=await api(`/api/support/activity?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`);
      dialog({title:`${title} Activity`,message:(rows||[]).slice(-12).map(x=>`${x.at||x.date||''} ${x.action||''}${x.detail?` — ${x.detail}`:''}`).join('\n')||'No activity recorded.'});
    }catch(e){dialog({title:'Activity unavailable',message:e.message});}
  }

  async function openSale(invoiceNo,actionsOnly=false){
    try{
      const d=await api('/api/operations/sales/by-invoice?invoiceNo='+encodeURIComponent(invoiceNo));
      if(actionsOnly){
        sheet(`${d.invoiceNo} Actions`,[
          {label:'View Details',run:()=>openSale(invoiceNo,false)},
          {label:'PDF / Print',run:()=>openCanonical('SALES',d.invoiceNo,'PDF')},
          {label:'Excel',run:()=>openCanonical('SALES',d.invoiceNo,'XLSX')},
          {label:'Activity Timeline',run:()=>showActivity('SALE',d.id,d.invoiceNo)}
        ]);
        return;
      }
      dialog({title:d.invoiceNo||'Sale',message:detailsMessage([
        ['Customer',d.customer?.name],['Date',d.invoiceDate],['Status',d.documentStatus||d.paymentStatus],
        ['Total',rupee(d.totalAmount)],['Paid',rupee(d.paidAmount)],['Due',rupee(Math.max(0,Number(d.totalAmount||0)-Number(d.paidAmount||0)))],
        ['Reference',d.referenceNo],['Payment Terms',d.paymentTerms],['Salesperson',d.salesperson],['Notes',d.notes]
      ]),confirm:'Actions',cancel:'Close',onConfirm:()=>openSale(invoiceNo,true)});
    }catch(e){dialog({title:'Sale unavailable',message:e.message});}
  }

  async function openPurchase(invoiceNo,actionsOnly=false){
    try{
      const d=await api('/api/operations/purchases/by-invoice?invoiceNo='+encodeURIComponent(invoiceNo));
      if(actionsOnly){
        sheet(`${d.invoiceNo} Actions`,[
          {label:'View Details',run:()=>openPurchase(invoiceNo,false)},
          {label:'PDF / Print',run:()=>openCanonical('PURCHASE',d.invoiceNo,'PDF')},
          {label:'Excel',run:()=>openCanonical('PURCHASE',d.invoiceNo,'XLSX')},
          {label:'Activity Timeline',run:()=>showActivity('PURCHASE',d.id,d.invoiceNo)}
        ]);
        return;
      }
      dialog({title:d.invoiceNo||'Purchase',message:detailsMessage([
        ['Supplier',d.supplier?.name],['Date',d.invoiceDate],['Status',d.documentStatus||d.paymentStatus],
        ['Total',rupee(d.totalAmount)],['Paid',rupee(d.paidAmount)],['Due',rupee(Math.max(0,Number(d.totalAmount||0)-Number(d.paidAmount||0)))],
        ['Reference',d.referenceNo],['Warehouse',d.warehouse],['Payment Terms',d.paymentTerms],['Notes',d.notes]
      ]),confirm:'Actions',cancel:'Close',onConfirm:()=>openPurchase(invoiceNo,true)});
    }catch(e){dialog({title:'Purchase unavailable',message:e.message});}
  }

  async function openQuotation(id){
    try{
      const d=await api(`/api/quotations/${encodeURIComponent(id)}`);
      dialog({title:d.no||'Quotation',message:detailsMessage([
        ['Customer',d.customer],['Date',d.date],['Valid Until',d.valid],['Status',d.status],['Amount',rupee(d.amount)],
        ['Salesperson',d.salesperson],['Follow Up',d.followUp],['Source',d.source],['Remarks',d.remarks]
      ])});
    }catch(e){dialog({title:'Quotation unavailable',message:e.message});}
  }

  async function openReturn(no){
    try{
      const d=await api(`/api/returns/${encodeURIComponent(no)}`);
      dialog({title:d.no||'Return',message:detailsMessage([
        ['Type',d.type],['Invoice',d.invoice],['Party',d.party],['Date',d.date],['Status',d.status],
        ['Refund Status',d.refundStatus],['Total',rupee(d.total)],['Refunded',rupee(d.refund)],['Notes',d.notes]
      ])});
    }catch(e){dialog({title:'Return unavailable',message:e.message});}
  }

  renderDashboard=function(){
    const d=state.dashboard,s=d?.snapshot||{},recent=d?.recent||[],acts=d?.activities||[];
    root.innerHTML=layout(`${!d?'<div class="loading"><strong>Loading dashboard…</strong>Connecting to ERP</div>':`
      <div class="search" id="globalSearch">${svg('search')}<input placeholder="Search ERP records…" readonly></div>
      <div class="kpis cols4">
        <div class="kpi green"><div class="label">Sales</div><div class="value">${shortMoney(s.salesValue)}</div></div>
        <div class="kpi blue"><div class="label">Receivable</div><div class="value">${shortMoney(s.receivables)}</div></div>
        <div class="kpi orange"><div class="label">Payable</div><div class="value">${shortMoney(s.payables)}</div></div>
        <div class="kpi purple"><div class="label">Bank</div><div class="value">${shortMoney(s.cash)}</div></div>
      </div>
      <div class="section-head"><h2>Recent Documents</h2><button data-tab="sales">View Sales</button></div>
      <div class="list">${recent.slice(0,6).map(r=>recordCard(r.number,r.party||r.type,r.amount,r.date,r.type,'Module')).join('')||'<div class="empty"><strong>No recent documents</strong>Nothing to display yet.</div>'}</div>
      <div class="section-head"><h2>Follow-ups</h2><button id="openReminders">Reminders</button></div>
      <div class="list">${acts.slice(0,4).map(a=>`<div class="card"><strong style="font-size:12px">${esc(a.title||a.category)}</strong><div class="meta" style="margin-top:3px">${esc(a.message||'')}</div></div>`).join('')||'<div class="empty"><strong>No follow-ups</strong>No active reminders.</div>'}</div>
    `}`,{title:'Dashboard',subtitle:state.user?.fullName||state.user?.username||'Business overview',refresh:true});
    bindCommon();
    document.getElementById('globalSearch')?.addEventListener('click',openGlobalSearch);
    document.getElementById('openReminders')?.addEventListener('click',()=>dialog({title:'Reminders',message:'Reminder data is available through the ERP Insights feed. Full reminder management remains in native Mobile for this UAT pass.'}));
  };

  renderSales=function(){
    const s=state.sales,m=s.metrics||{};
    root.innerHTML=layout(`
      <div class="kpis">
        <div class="kpi green"><div class="label">Today</div><div class="value">${shortMoney(m.todaySales)}</div></div>
        <div class="kpi orange"><div class="label">Pending</div><div class="value">${shortMoney(m.pendingBalance)}</div></div>
      </div>
      <div class="search">${svg('search')}<input id="salesQ" value="${esc(s.q)}" placeholder="Search invoices, customer…"><button class="more-btn" id="salesGo">⌕</button></div>
      <div class="filters">
        <button class="chip ${!s.status?'active':''}" data-status="">All</button>
        <button class="chip ${s.status==='PENDING'?'active':''}" data-status="PENDING">Pending</button>
        <button class="chip ${s.status==='PAID'?'active':''}" data-status="PAID">Paid</button>
        <button class="chip ${s.status==='PARTIAL'?'active':''}" data-status="PARTIAL">Partial</button>
      </div>
      <div class="list" id="salesList">${s.rows.length?s.rows.map(r=>`
        <div class="card record clickable-record" data-sale="${esc(r.invoiceNo)}">
          <div class="record-icon">▤</div>
          <div><h3>${esc(r.invoiceNo)}</h3><div class="sub">${esc(r.customer?.name||r.customerName||'')}</div>
            <div class="meta">${esc(dateOnly(r.invoiceDate))} • Paid ${rupee(r.paidAmount||0)} • Due ${rupee(Math.max(0,Number(r.totalAmount||0)-Number(r.paidAmount||0)))}</div></div>
          <div><button class="more-btn" data-sale-actions="${esc(r.invoiceNo)}">⋮</button><div class="amount">${rupee(Number(r.totalAmount||0))}</div><div class="badge ${badgeClass(r.paymentStatus||r.status||'')}">${esc(r.paymentStatus||r.status||'')}</div></div>
        </div>`).join(''):'<div class="loading"><strong>Loading sales…</strong>Fetching records</div>'}</div>
    `,{title:'Sales',subtitle:`${s.totalRows||0} records`,plus:can('SALES','CREATE'),refresh:true});
    bindCommon();
    const search=()=>{state.sales.q=document.getElementById('salesQ').value.trim();state.sales.page=0;loadSales(true)};
    document.getElementById('salesGo').onclick=search;
    document.getElementById('salesQ').onkeydown=e=>{if(e.key==='Enter')search()};
    document.querySelectorAll('[data-status]').forEach(b=>b.onclick=()=>{state.sales.status=b.dataset.status;loadSales(true)});
    document.querySelectorAll('[data-sale]').forEach(el=>el.addEventListener('click',e=>{
      if(e.target.closest('[data-sale-actions]')) return;
      openSale(el.dataset.sale,false);
    }));
    document.querySelectorAll('[data-sale-actions]').forEach(b=>b.onclick=e=>{e.stopPropagation();openSale(b.dataset.saleActions,true)});
    document.getElementById('plusBtn')?.addEventListener('click',()=>dialog({title:'New Sale',message:'Create/Edit remains intentionally disabled in this PWA UAT build until read-only parity is accepted, so no business data can be changed accidentally.'}));
  };

  function moreMenu(){
    return [
      ['search','Global Search','Search across ERP','search'],
      ['purchases','Purchases','Purchase register','sales'],
      ['quotations','Quotations','Quotation register','sales'],
      ['salesReturns','Sales Returns','Sales return register','sales'],
      ['purchaseReturns','Purchase Returns','Purchase return register','sales'],
      ['reports','Reports','Report definitions','home'],
      ['profile','Profile & Security','Account and session','more']
    ];
  }

  function moduleCard(screen,r){
    if(screen==='purchases') return `<div class="card record more-record" data-purchase="${esc(r.invoiceNo)}"><div class="record-icon">▥</div><div><h3>${esc(r.invoiceNo)}</h3><div class="sub">${esc(r.supplier?.name||'')}</div><div class="meta">${esc(dateOnly(r.invoiceDate))} • ${esc(r.paymentStatus||r.documentStatus||'')}</div></div><div><div class="amount">${rupee(r.totalAmount)}</div><button class="more-btn" data-purchase-actions="${esc(r.invoiceNo)}">⋮</button></div></div>`;
    if(screen==='quotations') return `<div class="card record more-record" data-quote="${esc(r.id)}"><div class="record-icon">Q</div><div><h3>${esc(r.no)}</h3><div class="sub">${esc(r.customer||'')}</div><div class="meta">${esc(dateOnly(r.date))} • ${esc(r.status||'')}</div></div><div class="amount">${rupee(r.amount)}</div></div>`;
    if(screen==='salesReturns'||screen==='purchaseReturns') return `<div class="card record more-record" data-return="${esc(r.no)}"><div class="record-icon">↩</div><div><h3>${esc(r.no)}</h3><div class="sub">${esc(r.party||'')}</div><div class="meta">${esc(dateOnly(r.date))} • Invoice ${esc(r.invoice||'')} • ${esc(r.status||'')}</div></div><div class="amount">${rupee(r.total)}</div></div>`;
    if(screen==='reports') return `<div class="card more-record" data-report="${esc(r.id)}"><strong>${esc(r.title)}</strong><div class="meta" style="margin-top:4px">${esc(r.category||'Report')} • ${esc(r.description||'')}</div></div>`;
    return '';
  }

  function bindMoreModule(){
    document.getElementById('moreBack')?.addEventListener('click',()=>{state.moreScreen='menu';state.moreRows=[];state.moreQuery='';renderMore()});
    const runSearch=()=>{state.moreQuery=document.getElementById('moreQ')?.value.trim()||'';loadMoreCurrent(true)};
    document.getElementById('moreGo')?.addEventListener('click',runSearch);
    document.getElementById('moreQ')?.addEventListener('keydown',e=>{if(e.key==='Enter')runSearch()});
    document.querySelectorAll('[data-purchase]').forEach(el=>el.onclick=e=>{if(e.target.closest('[data-purchase-actions]'))return;openPurchase(el.dataset.purchase,false)});
    document.querySelectorAll('[data-purchase-actions]').forEach(b=>b.onclick=e=>{e.stopPropagation();openPurchase(b.dataset.purchaseActions,true)});
    document.querySelectorAll('[data-quote]').forEach(el=>el.onclick=()=>openQuotation(el.dataset.quote));
    document.querySelectorAll('[data-return]').forEach(el=>el.onclick=()=>openReturn(el.dataset.return));
    document.querySelectorAll('[data-report]').forEach(el=>el.onclick=()=>{
      const r=state.moreRows.find(x=>String(x.id)===el.dataset.report);
      dialog({title:r?.title||'Report',message:detailsMessage([['Category',r?.category],['Description',r?.description],['Group By',(r?.groupByOptions||[]).join(', ')],['Filters',(r?.supportedFilters||[]).join(', ')]])});
    });
  }

  renderMore=function(){
    if(!state.moreScreen||state.moreScreen==='menu'){
      const mods=moreMenu();
      root.innerHTML=layout(`<div class="more-grid">${mods.map(([id,t,s,ic])=>`<button class="more-tile" data-more="${id}">${svg(ic)}<strong>${esc(t)}</strong><span>${esc(s)}</span></button>`).join('')}</div>
        <div class="section-head"><h2>UAT</h2></div><div class="card"><div class="meta">PWA ${esc(C.version)} • API ${esc(C.apiBaseUrl)}</div><div class="meta" style="margin-top:5px">Read-only module parity enabled. Business writes remain blocked for safety.</div></div>`,
        {title:'More',subtitle:'ERP modules'});
      bindCommon();
      document.querySelectorAll('[data-more]').forEach(b=>b.onclick=()=>{
        const id=b.dataset.more;
        if(id==='search') return openGlobalSearch();
        if(id==='profile') return openProfile();
        state.moreScreen=id;state.moreRows=[];state.moreQuery='';renderMore();loadMoreCurrent(true);
      });
      return;
    }
    const titles={purchases:'Purchases',quotations:'Quotations',salesReturns:'Sales Returns',purchaseReturns:'Purchase Returns',reports:'Reports'};
    root.innerHTML=layout(`
      <div class="filters"><button class="chip active" id="moreBack">← More</button></div>
      ${state.moreScreen==='reports'?'':`<div class="search">${svg('search')}<input id="moreQ" value="${esc(state.moreQuery)}" placeholder="Search ${esc(titles[state.moreScreen]||'records')}…"><button class="more-btn" id="moreGo">⌕</button></div>`}
      <div class="list">${state.moreLoading?'<div class="loading"><strong>Loading…</strong>Fetching ERP records</div>':state.moreRows.length?state.moreRows.map(r=>moduleCard(state.moreScreen,r)).join(''):'<div class="empty"><strong>No records</strong>Nothing matched this view.</div>'}</div>
    `,{title:titles[state.moreScreen]||'More',subtitle:'Read-only UAT',refresh:true});
    bindCommon();bindMoreModule();
  };

  async function loadMoreCurrent(force){
    if(!state.moreScreen||state.moreScreen==='menu') return;
    state.moreLoading=true;renderMore();
    try{
      let d;
      if(state.moreScreen==='purchases'){
        const q=new URLSearchParams({page:'0',size:'50',q:state.moreQuery});
        d=await api('/api/operations/purchases/page?'+q);state.moreRows=d.rows||[];
      }else if(state.moreScreen==='quotations'){
        const q=new URLSearchParams({page:'0',size:'50',q:state.moreQuery});
        d=await api('/api/quotations/page?'+q);state.moreRows=d.rows||[];
      }else if(state.moreScreen==='salesReturns'||state.moreScreen==='purchaseReturns'){
        const q=new URLSearchParams({type:state.moreScreen==='salesReturns'?'SALES':'PURCHASE',page:'0',size:'50',q:state.moreQuery});
        d=await api('/api/returns/page?'+q);state.moreRows=d.rows||[];
      }else if(state.moreScreen==='reports'){
        d=await api('/api/reporting/definitions');state.moreRows=Array.isArray(d)?d:[];
      }
    }catch(e){
      state.moreRows=[];
      dialog({title:'Module unavailable',message:e.message});
    }finally{
      state.moreLoading=false;renderMore();
    }
  }

  loadCurrent=async function(force){
    if(!state.token)return;
    if(state.tab==='dashboard')await loadDashboard(force);
    if(state.tab==='sales')await loadSales(force);
    if(state.tab==='bank')await loadBank(force);
    if(state.tab==='import')await loadImportHistory(force);
    if(state.tab==='more')await loadMoreCurrent(force);
  };
}
installPwaUatV2();
(async function init(){if(state.token){try{await bootstrap();const h=location.hash.slice(1);state.tab=['dashboard','sales','bank','import','more'].includes(h)?h:'dashboard';render();loadCurrent(false)}catch(e){tokenStore('',false);loginScreen(e.message)}}else loginScreen()})();
})();
