'use strict';
/* TBB POST OPTIMIZER — app.js
   Blogger API v3 · GSC API · Gemini AI · Jina Reader */

// ── CONSTANTS ─────────────────────────────────────────────────
const LS = { SETTINGS:'tbb_cfg', POSTS:'tbb_posts', GSC:'tbb_gsc', THEME:'tbb_theme', BLOG:'tbb_blog' };
const SCOPES = 'https://www.googleapis.com/auth/blogger https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/userinfo.profile';
const EP = {
  BLOGGER:   'https://www.googleapis.com/blogger/v3',
  GSC:       'https://searchconsole.googleapis.com/webmasters/v3',
  GEMINI:    'https://generativelanguage.googleapis.com/v1beta/models',
  GEMINI_IMG:'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent',
  JINA_R:    'https://r.jina.ai/',
  JINA_S:    'https://s.jina.ai/',
  CSE:       'https://www.googleapis.com/customsearch/v1',
  ME:        'https://www.googleapis.com/oauth2/v3/userinfo',
};
const CIRC = parseFloat((2 * Math.PI * 24).toFixed(2));

// ── STATE ─────────────────────────────────────────────────────
const S = {
  token:null, blogId:null, blogUrl:null,
  posts:[], gsc:{}, post:null, analysis:null, rewrite:null,
  queue:[], batching:false,
  filter:'urgent', sort:'score-asc', q:'',
  tc:null, cfg:{},
};

// ── DOM ───────────────────────────────────────────────────────
const $  = id  => document.getElementById(id);
const $q = sel => document.querySelector(sel);
const $a = sel => document.querySelectorAll(sel);
const esc = s  => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const wait = ms => new Promise(r => setTimeout(r, ms));

// ── TOAST ─────────────────────────────────────────────────────
function toast(msg, type='info', ms=4000) {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  $('toasts').appendChild(el);
  setTimeout(() => {
    el.style.cssText = 'opacity:0;transform:translateX(1rem);transition:all .3s ease';
    setTimeout(() => el.remove(), 320);
  }, ms);
}
window.toast = toast;

// ── MODAL ─────────────────────────────────────────────────────
function showModal(title, html, btns=[]) {
  return new Promise(resolve => {
    $('modal-title').textContent = title;
    $('modal-body').innerHTML = html;
    const ftr = $('modal-footer');
    ftr.innerHTML = '';
    btns.forEach(b => {
      const btn = document.createElement('button');
      btn.className = `btn ${b.cls}`; btn.textContent = b.label;
      btn.onclick = () => { closeModal(); resolve(b.val); };
      ftr.appendChild(btn);
    });
    $('modal-overlay').classList.remove('hidden');
    $('modal-close').onclick = () => { closeModal(); resolve(null); };
  });
}
function closeModal() { $('modal-overlay').classList.add('hidden'); }

// ── VIEW ──────────────────────────────────────────────────────
function showView(name) {
  $a('.view').forEach(v => {
    const match = v.id === `view-${name}`;
    v.classList.toggle('active', match);
    v.classList.toggle('hidden', !match);
  });
  $a('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  scrollTo(0, 0);
}

// ── THEME ─────────────────────────────────────────────────────
function initTheme() {
  const t = localStorage.getItem(LS.THEME) || 'dark';
  document.documentElement.dataset.theme = t;
  $('btn-theme').textContent = t === 'dark' ? '🌙' : '☀️';
}
function toggleTheme() {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  localStorage.setItem(LS.THEME, t);
  $('btn-theme').textContent = t === 'dark' ? '🌙' : '☀️';
}

// ── SETTINGS ─────────────────────────────────────────────────
const CFG_DEFAULTS = {
  clientId:'', geminiKey:'', claudeKey:'', openaiKey:'',
  cseKey:'', cseCx:'', siteUrl:'https://www.thebukitbesi.com/',
  staleMonths:6, rewriteMode:'smart', langMode:'auto', wcTarget:'plus15',
};
const Cfg = {
  load() {
    try { S.cfg = { ...CFG_DEFAULTS, ...JSON.parse(localStorage.getItem(LS.SETTINGS)||'{}') }; }
    catch { S.cfg = { ...CFG_DEFAULTS }; }
  },
  save() {
    [['clientId','s-client-id'],['geminiKey','s-gemini-key'],['claudeKey','s-claude-key'],
     ['openaiKey','s-openai-key'],['cseKey','s-cse-key'],['cseCx','s-cse-cx'],['siteUrl','s-site-url']
    ].forEach(([k,id]) => { S.cfg[k] = $(id).value.trim(); });
    S.cfg.staleMonths = +$('s-stale-months').value;
    S.cfg.rewriteMode = $('s-rewrite-mode').value;
    S.cfg.langMode    = $('s-lang-mode').value;
    S.cfg.wcTarget    = $('s-wc-target').value;
    localStorage.setItem(LS.SETTINGS, JSON.stringify(S.cfg));
    toast('Settings saved', 'success');
  },
  populate() {
    $('s-client-id').value    = S.cfg.clientId    || '';
    $('s-gemini-key').value   = S.cfg.geminiKey   || '';
    $('s-claude-key').value   = S.cfg.claudeKey   || '';
    $('s-openai-key').value   = S.cfg.openaiKey   || '';
    $('s-cse-key').value      = S.cfg.cseKey      || '';
    $('s-cse-cx').value       = S.cfg.cseCx       || '';
    $('s-site-url').value     = S.cfg.siteUrl      || '';
    $('s-stale-months').value = String(S.cfg.staleMonths || 6);
    $('s-rewrite-mode').value = S.cfg.rewriteMode  || 'smart';
    $('s-lang-mode').value    = S.cfg.langMode     || 'auto';
    $('s-wc-target').value    = S.cfg.wcTarget     || 'plus15';
    $('current-origin').textContent = location.origin;
  },
  clear() {
    localStorage.removeItem(LS.SETTINGS);
    S.cfg = { ...CFG_DEFAULTS };
    this.populate();
    toast('Settings cleared', 'info');
  },
};
window.togglePwd = id => { const el=$(id); el.type = el.type==='password'?'text':'password'; };

// ── AUTH ──────────────────────────────────────────────────────
const Auth = {
  init() {
    if (!S.cfg.clientId) { toast('Enter OAuth Client ID in Settings first','warn'); showView('settings'); return; }
    if (typeof google==='undefined') { toast('Google Sign-In not loaded — check internet','error'); return; }
    S.tc = google.accounts.oauth2.initTokenClient({
      client_id: S.cfg.clientId, scope: SCOPES,
      callback: async r => {
        if (r.error) { toast('Auth: '+r.error,'error'); return; }
        S.token = r.access_token;
        await this.onAuth();
      },
    });
    S.tc.requestAccessToken();
  },
  async onAuth() {
    try {
      const me = await apiFetch(EP.ME);
      $('user-name').textContent   = me.name || 'User';
      $('user-avatar').textContent = (me.name||'U')[0].toUpperCase();
      if (me.picture) {
        const img = document.createElement('img');
        img.src = me.picture; img.alt = '';
        $('user-avatar').innerHTML = ''; $('user-avatar').appendChild(img);
      }
      await this.detectBlog();
      $('login-screen').classList.add('hidden');
      $('app').classList.remove('hidden');
      showView('dashboard');
      await Dash.load();
    } catch(e) { toast('Sign-in failed: '+e.message,'error'); }
  },
  async detectBlog() {
    const cached = localStorage.getItem(LS.BLOG);
    if (cached) {
      const [id,url] = cached.split('|');
      S.blogId=id; S.blogUrl=url;
      $('user-blog').textContent = new URL(url).hostname; return;
    }
    let blog;
    try { blog = await apiFetch(`${EP.BLOGGER}/blogs/byurl?url=${encodeURIComponent(S.cfg.siteUrl)}`); }
    catch { const r=await apiFetch(`${EP.BLOGGER}/users/self/blogs`); blog=r.items?.[0]; }
    if (!blog) throw new Error('No blog found — check Site URL in Settings');
    S.blogId=blog.id; S.blogUrl=blog.url;
    localStorage.setItem(LS.BLOG, `${blog.id}|${blog.url}`);
    $('user-blog').textContent = new URL(blog.url).hostname;
  },
  signOut() {
    S.token=null; S.blogId=null; S.posts=[]; S.gsc={};
    localStorage.removeItem(LS.BLOG);
    $('app').classList.add('hidden');
    $('login-screen').classList.remove('hidden');
    try { google.accounts.oauth2.revoke(S.token, ()=>{}); } catch {}
    toast('Signed out','info');
  },
};

// ── API HELPERS ───────────────────────────────────────────────
async function apiFetch(url, opts={}) {
  const res = await fetch(url, {
    ...opts, headers:{ Authorization:`Bearer ${S.token}`, 'Content-Type':'application/json', ...opts.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0,200)}`);
  return res.json();
}

async function callGemini(prompt, model='gemini-2.0-flash') {
  if (!S.cfg.geminiKey) throw new Error('Gemini API key missing — add in Settings');
  const res = await fetch(`${EP.GEMINI}/${model}:generateContent?key=${S.cfg.geminiKey}`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      contents:[{role:'user',parts:[{text:prompt}]}],
      generationConfig:{temperature:0.7, maxOutputTokens:8192, topP:0.95},
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0,200)}`);
  const d = await res.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGeminiImg(prompt) {
  if (!S.cfg.geminiKey) throw new Error('Gemini API key missing');
  const res = await fetch(`${EP.GEMINI_IMG}?key=${S.cfg.geminiKey}`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      contents:[{role:'user',parts:[{text:prompt}]}],
      generationConfig:{responseModalities:['TEXT','IMAGE']},
    }),
  });
  if (!res.ok) throw new Error(`Gemini image ${res.status}`);
  const d = await res.json();
  const p = d.candidates?.[0]?.content?.parts?.find(x=>x.inlineData);
  if (!p) throw new Error('No image returned');
  return `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
}

async function jinaRead(url) {
  try {
    const res = await fetch(EP.JINA_R + encodeURIComponent(url), { headers:{Accept:'text/markdown'} });
    return res.ok ? res.text() : '';
  } catch { return ''; }
}

async function jinaSearch(q) {
  try {
    const res = await fetch(EP.JINA_S + encodeURIComponent(q), { headers:{Accept:'application/json'} });
    if (!res.ok) return [];
    const d = await res.json();
    return (d.data||[]).slice(0,5).map(r=>({url:r.url, title:r.title||''}));
  } catch { return []; }
}

async function searchCompetitors(q) {
  const site = S.cfg.siteUrl ? new URL(S.cfg.siteUrl).hostname : '';
  const query = site ? `${q} -site:${site}` : q;
  if (S.cfg.cseKey && S.cfg.cseCx) {
    try {
      const res = await fetch(`${EP.CSE}?key=${S.cfg.cseKey}&cx=${S.cfg.cseCx}&q=${encodeURIComponent(query)}&num=5`);
      if (res.ok) { const d=await res.json(); return (d.items||[]).slice(0,5).map(i=>({url:i.link,title:i.title})); }
    } catch {}
  }
  return jinaSearch(query);
}

// ── BLOGGER API ───────────────────────────────────────────────
const BlogAPI = {
  async fetchAll() {
    const posts=[]; let tok=null, page=0;
    const fields='items(id,title,url,published,updated,labels,content),nextPageToken';
    do {
      const url=`${EP.BLOGGER}/blogs/${S.blogId}/posts?maxResults=500&status=LIVE&fields=${fields}${tok?'&pageToken='+tok:''}`;
      const d = await apiFetch(url);
      if (d.items) posts.push(...d.items);
      tok = d.nextPageToken;
    } while (tok && ++page < 20);
    return posts;
  },
  update: (id, data) => apiFetch(`${EP.BLOGGER}/blogs/${S.blogId}/posts/${id}`, {
    method:'PATCH', body:JSON.stringify(data),
  }),
};

// ── GSC API ───────────────────────────────────────────────────
const GSCAPI = {
  async sync() {
    if (!S.cfg.siteUrl) { toast('Set Site URL in Settings','warn'); return; }
    const end   = new Date().toISOString().slice(0,10);
    const start = new Date(Date.now()-90*864e5).toISOString().slice(0,10);
    try {
      const d = await apiFetch(
        `${EP.GSC}/sites/${encodeURIComponent(S.cfg.siteUrl)}/searchAnalytics/query`,
        {method:'POST', body:JSON.stringify({startDate:start,endDate:end,dimensions:['page'],rowLimit:5000})}
      );
      S.gsc={};
      (d.rows||[]).forEach(r => { S.gsc[r.keys[0]]={clicks:r.clicks,impressions:r.impressions,ctr:r.ctr,position:r.position}; });
      localStorage.setItem(LS.GSC, JSON.stringify(S.gsc));
      toast(`GSC synced — ${Object.keys(S.gsc).length} URLs`,'success');
      S.posts.forEach(p=>Score.calc(p)); Dash.render();
    } catch(e) { toast('GSC failed: '+e.message,'error'); }
  },
  get(post) {
    const u=post.url;
    return S.gsc[u]||S.gsc[u+'/']||S.gsc[u.replace(/\/$/,'')]||null;
  },
};

// ── SCORER ────────────────────────────────────────────────────
const Score = {
  strip: h => (h||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(),
  words: t => t.trim().split(/\s+/).filter(Boolean).length,
  months: d => (Date.now()-new Date(d).getTime())/(30*864e5),
  heads: h => (h.match(/<h[23][^>]*>(.*?)<\/h[23]>/gi)||[]).map(x=>x.replace(/<[^>]+>/g,'').trim()),
  hasImg: h => /<img/i.test(h||''),
  hasLinks(h, site) {
    if (!site) return false;
    try { return new RegExp(`href=["'][^"']*${new URL(site).hostname}`,'i').test(h||''); } catch { return false; }
  },
  lang(text) {
    const hits=(text.match(/\b(yang|dan|ini|itu|untuk|dengan|dari|pada|tidak|saya|kami|mereka|adalah|akan|boleh|ada|jika|atau|dalam|oleh|kepada|telah|kerana|selepas|sebelum|antara|ialah|seperti|sudah|lebih|masih|hanya|bagi|juga)\b/gi)||[]).length;
    return hits/Math.max(this.words(text),1)>0.04?'ms':'en';
  },
  calc(p) {
    const txt=this.strip(p.content||''), wc=this.words(txt), mo=this.months(p.updated||p.published);
    const g=GSCAPI.get(p), hds=this.heads(p.content||'');
    const fresh = mo<1?30:mo<3?25:mo<6?15:mo<12?5:0;
    const depth = wc>=2000?25:wc>=1500?20:wc>=1000?15:wc>=500?8:3;
    let gp=10;
    if(g) gp=g.position<=3?20:g.position<=10?15:g.position<=20?8:g.position<=50?3:1;
    let comp=0;
    if(this.hasImg(p.content)) comp+=5;
    if(hds.length>=2) comp+=5;
    if(this.hasLinks(p.content,S.cfg.siteUrl)) comp+=3;
    if((p.labels||[]).length>0) comp+=2;
    let eng=5;
    if(g) eng=g.ctr>=.05?10:g.ctr>=.03?8:g.ctr>=.01?5:2;
    p._s=fresh+depth+gp+comp+eng;
    p._bd={fresh,depth,gp,comp,eng}; p._w=wc; p._mo=mo; p._lg=this.lang(txt); p._hd=hds; p._g=g;
    return p._s;
  },
  tier(s) {
    if(s<=35) return {mode:'full',   label:'Full Rewrite',  col:'danger'};
    if(s<=65) return {mode:'expand', label:'Expand',        col:'warn'  };
    if(s<=85) return {mode:'refresh',label:'Refresh Stats', col:'accent'};
    return           {mode:'micro',  label:'Micro-update',  col:'success'};
  },
  color(s) { return s<=35?'var(--danger)':s<=65?'var(--warn)':s<=85?'var(--accent-2)':'var(--success)'; },
};

// ── DASHBOARD ─────────────────────────────────────────────────
const Dash = {
  async load(force=false) {
    $('post-list').innerHTML='<div class="empty-state"><div class="spinner"></div><p>Fetching from Blogger…</p></div>';
    try { S.gsc=JSON.parse(localStorage.getItem(LS.GSC)||'{}'); } catch {}
    try {
      let raw; const cache=localStorage.getItem(LS.POSTS);
      if(!force&&cache) { raw=JSON.parse(cache); toast('Posts from cache — click ↻ to refresh','info',3000); }
      else { raw=await BlogAPI.fetchAll(); localStorage.setItem(LS.POSTS,JSON.stringify(raw)); }
      S.posts=raw.map(p=>{Score.calc(p);return p;});
      this.stats(); this.render();
    } catch(e) {
      $('post-list').innerHTML=`<div class="empty-state"><p style="color:var(--danger)">Error: ${esc(e.message)}</p><button class="btn btn-primary" onclick="Dash.load(true)">Retry</button></div>`;
    }
  },
  stats() {
    const sm=S.cfg.staleMonths||6;
    $('stat-total').querySelector('.stat-val').textContent  = S.posts.length;
    $('stat-urgent').querySelector('.stat-val').textContent = S.posts.filter(p=>p._s<=35).length;
    $('stat-stale').querySelector('.stat-val').textContent  = S.posts.filter(p=>p._mo>=sm).length;
    $('stat-page2').querySelector('.stat-val').textContent  = S.posts.filter(p=>p._g&&p._g.position>10).length;
    $('stat-english').querySelector('.stat-val').textContent= S.posts.filter(p=>p._lg==='en').length;
    $('nav-badge-batch').textContent = S.queue.length;
    const runBtn=$('btn-run-batch');
    runBtn.textContent=`▶ Start Batch (${S.queue.length})`; runBtn.disabled=!S.queue.length;
  },
  filtered() {
    const sm=S.cfg.staleMonths||6;
    let ps=[...S.posts];
    if(S.filter==='urgent')  ps=ps.filter(p=>p._s<=35);
    if(S.filter==='stale')   ps=ps.filter(p=>p._mo>=sm);
    if(S.filter==='page2')   ps=ps.filter(p=>p._g&&p._g.position>10);
    if(S.filter==='english') ps=ps.filter(p=>p._lg==='en');
    if(S.q) { const q=S.q.toLowerCase(); ps=ps.filter(p=>p.title.toLowerCase().includes(q)); }
    if(S.sort==='score-asc')  ps.sort((a,b)=>a._s-b._s);
    if(S.sort==='score-desc') ps.sort((a,b)=>b._s-a._s);
    if(S.sort==='date-asc')   ps.sort((a,b)=>new Date(a.updated)-new Date(b.updated));
    if(S.sort==='date-desc')  ps.sort((a,b)=>new Date(b.updated)-new Date(a.updated));
    return ps;
  },
  render() {
    const ps=this.filtered(), el=$('post-list');
    if(!ps.length){el.innerHTML='<div class="empty-state"><p>No posts match this filter.</p></div>';return;}
    el.innerHTML=ps.map(p=>this.card(p)).join('');
    el.querySelectorAll('.post-card').forEach(c=>{
      const post=S.posts.find(p=>p.id===c.dataset.id);
      c.querySelector('.btn-opt')?.addEventListener('click',e=>{e.stopPropagation();Opt.open(post);});
      c.querySelector('.btn-queue')?.addEventListener('click',e=>{e.stopPropagation();Queue.add(post);});
      c.querySelector('.btn-view')?.addEventListener('click',e=>{e.stopPropagation();post&&window.open(post.url,'_blank');});
    });
  },
  card(p) {
    const t=Score.tier(p._s), col=Score.color(p._s), g=p._g;
    const dash=(p._s/100)*CIRC, off=(CIRC-dash).toFixed(1);
    const inQ=S.queue.some(x=>x.id===p.id);
    const ago=p._mo<1?'This month':p._mo<12?Math.round(p._mo)+'mo ago':Math.round(p._mo/12)+'yr ago';
    return `<div class="post-card" data-id="${p.id}">
  <div class="pc-ring">
    <svg viewBox="0 0 56 56"><circle class="ring-bg" cx="28" cy="28" r="24"/>
      <circle cx="28" cy="28" r="24" fill="none" stroke="${col}" stroke-width="4"
        stroke-linecap="round" stroke-dasharray="${CIRC}" stroke-dashoffset="${off}"/></svg>
    <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;color:${col}">${p._s}</span>
  </div>
  <div class="pc-body">
    <div class="pc-title">${esc(p.title)}</div>
    <div class="pc-meta">
      <span class="badge badge-${t.col}">${t.label}</span>
      <span class="badge badge-muted">${p._lg==='ms'?'🇲🇾 MY':'🇬🇧 EN'}</span>
      <span class="badge badge-muted">${p._w}w</span>
      ${g?`<span class="badge badge-muted">Pos ${g.position.toFixed(1)}</span>`:''}
      <span class="badge badge-muted">${ago}</span>
    </div>
    ${g?`<div class="pc-gsc">📈 ${g.clicks} clicks · ${g.impressions} imp · ${(g.ctr*100).toFixed(1)}% CTR</div>`:''}
  </div>
  <div class="pc-actions">
    <button class="btn btn-primary btn-sm btn-opt">⚡ Optimize</button>
    <button class="btn btn-ghost btn-sm btn-queue"${inQ?' disabled':''}>${inQ?'✓ Queued':'+ Queue'}</button>
    <button class="btn btn-ghost btn-sm btn-view">↗</button>
  </div></div>`;
  },
};
window.Dash = Dash;

// ── OPTIMIZER ─────────────────────────────────────────────────
const Opt = {
  open(p) {
    if(!p) return;
    S.post=p; S.analysis=null; S.rewrite=null;
    $('opt-post-title').textContent=p.title;
    $('opt-post-meta').innerHTML=`
      <span class="badge badge-muted">${p._lg==='ms'?'🇲🇾 Malay':'🇬🇧 English'}</span>
      <span class="badge badge-muted">${p._w} words</span>
      <span class="badge badge-muted">Updated ${new Date(p.updated||p.published).toLocaleDateString()}</span>
      ${p._g?`<span class="badge badge-muted">Pos ${p._g.position.toFixed(1)}</span>`:''}`;
    this.setRing(p._s);
    $('comp-keyword').value=p.title.split(/\s+/).slice(0,6).join(' ');
    $('content-metrics').innerHTML  = this.metricsHTML(p);
    $('score-breakdown').innerHTML  = this.breakdownHTML(p);
    this.gscDetail(p);
    $('competitor-list').innerHTML  = '<p class="muted-txt">Click "Fetch Top 3" to analyze competitors</p>';
    $('content-gaps').innerHTML     = '<p class="muted-txt">Run competitor analysis first</p>';
    $('unique-angles').innerHTML    = '<p class="muted-txt">Run competitor analysis first</p>';
    $('diff-container').classList.add('hidden');
    $('rewrite-placeholder').classList.remove('hidden');
    $('rewrite-actions').classList.add('hidden');
    $('prompt-grid').innerHTML      = '<p class="muted-txt text-center">Click "Generate Prompts" to create image prompts</p>';
    $('schema-output').innerHTML    = '<p class="muted-txt">Schema will appear here</p>';
    $('social-grid').innerHTML      = '<p class="muted-txt">Click generate for social content</p>';
    $('gemini-image-output').innerHTML = '';
    const defMode=S.cfg.rewriteMode||'smart';
    $a('.mbtn').forEach(b=>b.classList.toggle('active',b.dataset.mode===defMode));
    $a('.otab').forEach(t=>t.classList.toggle('active',t.dataset.tab==='analyze'));
    $a('.opt-panel').forEach(p=>{ p.classList.toggle('active',p.id==='panel-analyze'); p.classList.toggle('hidden',p.id!=='panel-analyze'); });
    showView('optimizer');
  },
  setRing(score) {
    const ring=$('ring-fg'), col=Score.color(score), dash=(score/100)*CIRC;
    ring.setAttribute('stroke',col);
    ring.setAttribute('stroke-dasharray',CIRC.toString());
    ring.setAttribute('stroke-dashoffset',(CIRC-dash).toFixed(1));
    $('opt-score-num').textContent=score; $('opt-score-num').style.color=col;
    const t=Score.tier(score);
    $('opt-score-label').textContent=t.label;
    $('opt-score-rec').textContent={full:'⚠️ Major work needed',expand:'📝 Needs expansion',refresh:'✨ Minor updates needed',micro:'✅ Fine-tune only'}[t.mode];
  },
  metricsHTML(p) {
    const g=p._g;
    const rows=[
      ['Word Count',     `${p._w}`,     p._w<1000?'danger':p._w<1500?'warn':'ok'],
      ['Language',       p._lg==='ms'?'🇲🇾 Malay':'🇬🇧 English','ok'],
      ['Age',            p._mo<1?'This month':Math.round(p._mo)+'mo', p._mo>12?'danger':p._mo>6?'warn':'ok'],
      ['H2/H3 Headings', `${p._hd.length}`, p._hd.length<2?'warn':'ok'],
      ['Labels',         (p.labels||[]).join(', ')||'None', (p.labels||[]).length===0?'warn':'ok'],
    ];
    if(g) {
      rows.push(['GSC Position',g.position.toFixed(1),g.position>20?'danger':g.position>10?'warn':'ok']);
      rows.push(['CTR',(g.ctr*100).toFixed(2)+'%',g.ctr<0.02?'warn':'ok']);
      rows.push(['Clicks (90d)',g.clicks.toLocaleString(),'ok']);
      rows.push(['Impressions',g.impressions.toLocaleString(),'ok']);
    }
    return rows.map(([l,v,s])=>`<div class="metric-row"><span class="metric-lbl">${l}</span><span class="metric-val metric-${s}">${esc(v)}</span></div>`).join('');
  },
  breakdownHTML(p) {
    if(!p._bd) return '<p class="muted-txt">No data</p>';
    return [['Freshness',p._bd.fresh,30],['Depth',p._bd.depth,25],['GSC',p._bd.gp,20],['Completeness',p._bd.comp,15],['Engagement',p._bd.eng,10]].map(([l,v,m])=>{
      const pct=Math.round(v/m*100), c=pct<40?'danger':pct<70?'warn':'success';
      return `<div class="sbar-row"><div class="sbar-lbl"><span>${l}</span><span>${v}/${m}</span></div>
        <div class="sbar-track"><div class="sbar-fill sbar-${c}" style="width:${pct}%"></div></div></div>`;
    }).join('');
  },
  gscDetail(p) {
    const g=p._g, badge=$('gsc-status');
    if(!g){ $('gsc-metrics-detail').innerHTML='<p class="muted-txt">Sync GSC on dashboard to load data</p>'; badge.textContent='Not synced'; badge.className='badge badge-muted'; return; }
    badge.textContent='Synced'; badge.className='badge badge-success';
    $('gsc-metrics-detail').innerHTML=`<div class="gsc-grid">
      <div class="gsc-card"><div class="gsc-val">${g.position.toFixed(1)}</div><div class="gsc-lbl">Position</div></div>
      <div class="gsc-card"><div class="gsc-val">${g.clicks}</div><div class="gsc-lbl">Clicks</div></div>
      <div class="gsc-card"><div class="gsc-val">${g.impressions}</div><div class="gsc-lbl">Impressions</div></div>
      <div class="gsc-card"><div class="gsc-val">${(g.ctr*100).toFixed(1)}%</div><div class="gsc-lbl">CTR</div></div>
    </div><p class="muted-txt" style="margin-top:.5rem;font-size:.78rem">Last 90 days</p>`;
  },
  async fetchCompetitors() {
    const kw=$('comp-keyword').value.trim();
    if(!kw){ toast('Enter a keyword','warn'); return; }
    const btn=$('btn-fetch-competitors');
    btn.textContent='⏳…'; btn.disabled=true;
    $('competitor-list').innerHTML='<div class="spinner"></div>';
    try {
      const hits=await searchCompetitors(kw);
      const urls=hits.slice(0,3).map(h=>h.url);
      let compMd='', compData=[];
      for(const url of urls) {
        const md=await jinaRead(url);
        const hds=(md.match(/^#{1,3}.+$/gm)||[]).slice(0,8).map(h=>h.replace(/^#+\s*/,''));
        const wc=md.split(/\s+/).length;
        compData.push({url,hds,wc});
        compMd+=`\n\n### ${url}\nHeadings: ${hds.join(' | ')}\nExcerpt: ${md.slice(0,600)}`;
      }
      $('competitor-list').innerHTML=compData.length?compData.map(c=>`
        <div class="comp-card">
          <div class="comp-url"><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(new URL(c.url).hostname+new URL(c.url).pathname.slice(0,35))}</a></div>
          <span class="badge badge-muted">${c.wc} words</span>
          <div class="comp-headings" style="margin-top:.4rem">${c.hds.slice(0,5).map(h=>`<span class="comp-h">${esc(h)}</span>`).join('')}</div>
        </div>`).join(''):'<p class="muted-txt">No results found</p>';

      $('content-gaps').innerHTML='<div class="spinner"></div>';
      const avgWc=compData.filter(c=>c.wc>0).reduce((s,c)=>s+c.wc,0)/Math.max(compData.filter(c=>c.wc>0).length,1);
      const raw=await callGemini(Prompts.analysis(S.post,compMd));
      let an; try{ an=JSON.parse(raw.replace(/```json\n?|```/g,'').trim()); }catch{ an={gaps:[],unique:[],competitorAvgWords:Math.round(avgWc),featuredSnippetOpportunity:''}; }
      an.competitorAvgWords=an.competitorAvgWords||Math.round(avgWc);
      S.analysis=an;
      $('content-gaps').innerHTML=(an.gaps||[]).length
        ? (an.gaps.map(g=>`<div class="gap-item">🎯 ${esc(g)}</div>`).join(''))+(an.featuredSnippetOpportunity?`<div class="fsnip-tip">💡 <strong>Featured Snippet:</strong> ${esc(an.featuredSnippetOpportunity)}</div>`:'')
        : '<p class="muted-txt">No major gaps found</p>';
      $('unique-angles').innerHTML=(an.unique||[]).length
        ? an.unique.map(u=>`<div class="gap-item gap-unique">✨ ${esc(u)}</div>`).join('')
        : '<p class="muted-txt">Add Malaysian-specific context to differentiate</p>';
      toast('Analysis done!','success');
    } catch(e){ $('competitor-list').innerHTML=`<p style="color:var(--danger)">${esc(e.message)}</p>`; toast('Analysis failed: '+e.message,'error'); }
    finally{ btn.textContent='Fetch Top 3'; btn.disabled=false; }
  },
  async generateRewrite() {
    const p=S.post; if(!p) return;
    const mode=$q('.mbtn.active')?.dataset.mode||'smart';
    const opts={faq:$('chk-faq').checked, local:$('chk-local').checked, snippet:$('chk-snippet').checked};
    const btn=$('btn-generate-rewrite');
    const prog=$('rewrite-progress'), bar=$('rewrite-prog-bar');
    btn.disabled=true; prog.classList.remove('hidden');
    $('rewrite-placeholder').classList.add('hidden');
    $('diff-container').classList.add('hidden');
    $('rewrite-actions').classList.add('hidden');
    const steps=['Analyzing post…','Fetching competitor data…','Building prompt…','Generating content…','Processing…'];
    const setStep=(i,done=false)=>{
      $('progress-steps').innerHTML=steps.map((s,j)=>`<div class="prog-step ${j<i?'done':j===i?'active':''}">${j<i?'✓':j===i?(done?'✓':'⏳'):'○'} ${s}</div>`).join('');
      bar.style.width=`${Math.round(((i+(done?1:0))/steps.length)*100)}%`;
    };
    try {
      setStep(0); await wait(150);
      setStep(1);
      if(!S.analysis){
        try{
          const kw=p.title.split(/\s+/).slice(0,5).join(' ');
          const hits=await searchCompetitors(kw);
          if(hits[0]){ const md=await jinaRead(hits[0].url); const raw=await callGemini(Prompts.analysis(p,md)); S.analysis=JSON.parse(raw.replace(/```json\n?|```/g,'').trim()); }
        }catch{}
      }
      setStep(2); const prompt=Prompts.rewrite(p,S.analysis,mode,opts);
      setStep(3); const html=await callGemini(prompt);
      setStep(4); S.rewrite=html; setStep(4,true); bar.style.width='100%';
      await wait(150);
      const ot=Score.strip(p.content||''), nt=Score.strip(html);
      const ow=Score.words(ot), nw=Score.words(nt), dw=nw-ow;
      $('diff-original').innerHTML=`<div>${esc(ot.slice(0,600))}${ot.length>600?`<span class="muted-txt">…+${ot.length-600} chars</span>`:''}</div>`;
      $('diff-rewrite').innerHTML =`<div>${esc(nt.slice(0,600))}${nt.length>600?`<span class="muted-txt">…+${nt.length-600} chars</span>`:''}</div>`;
      $('diff-stats').innerHTML=`<span>Original: <strong>${ow}w</strong></span><span>Optimized: <strong>${nw}w</strong></span><span style="color:${dw>=0?'var(--success)':'var(--danger)'}">${dw>=0?'+':''}${dw}w (${Math.round(dw/Math.max(ow,1)*100)}%)</span>`;
      prog.classList.add('hidden');
      $('diff-container').classList.remove('hidden');
      $('rewrite-actions').classList.remove('hidden');
      toast('Rewrite complete!','success');
    }catch(e){
      prog.classList.add('hidden');
      $('rewrite-placeholder').classList.remove('hidden');
      toast('Rewrite failed: '+e.message,'error');
    }finally{ btn.disabled=false; }
  },
  async publish() {
    const p=S.post, html=S.rewrite; if(!p||!html) return;
    const ok=await showModal('Publish Optimized Content?',
      `<p>This updates the <strong>live post</strong> on Blogger:</p><p style="margin:.75rem 0"><strong>${esc(p.title)}</strong></p><p>Existing content will be replaced with the AI version.</p>`,
      [{label:'🚀 Publish Now',cls:'btn-success',val:true},{label:'Cancel',cls:'btn-ghost',val:false}]);
    if(!ok) return;
    const btn=$('btn-publish-rewrite');
    btn.disabled=true; btn.textContent='⏳ Publishing…';
    try{
      await BlogAPI.update(p.id,{content:html,updated:new Date().toISOString()});
      p.content=html; Score.calc(p); this.setRing(p._s);
      localStorage.setItem(LS.POSTS,JSON.stringify(S.posts));
      btn.textContent='✓ Published'; toast('Published!','success');
    }catch(e){ btn.disabled=false; btn.textContent='🚀 Approve & Publish'; toast('Publish failed: '+e.message,'error'); }
  },
  async genPrompts() {
    const p=S.post, style=$q('.spill.active[data-style]')?.dataset.style||'photorealistic';
    const btn=$('btn-gen-prompts'), grid=$('prompt-grid');
    btn.disabled=true; btn.textContent='⏳…'; grid.innerHTML='<div class="spinner"></div>';
    try{
      const raw=await callGemini(Prompts.imgPrompts(p,style));
      const prompts=JSON.parse(raw.replace(/```json\n?|```/g,'').trim());
      grid.innerHTML=prompts.map((pr,i)=>`<div class="prompt-card">
        <div class="prompt-num">Prompt ${i+1} — ${style}</div>
        <div class="prompt-text">${esc(pr)}</div>
        <div class="prompt-actions">
          <button class="btn btn-sm btn-ghost" onclick="navigator.clipboard.writeText(${JSON.stringify(pr)}).then(()=>toast('Copied!','success'))">📋 Copy</button>
          <button class="btn btn-sm btn-secondary" onclick="$('custom-prompt').value=${JSON.stringify(pr)}">Use in Gemini →</button>
        </div></div>`).join('');
      toast('Prompts ready!','success');
    }catch(e){ grid.innerHTML=`<p style="color:var(--danger)">${esc(e.message)}</p>`; toast('Failed: '+e.message,'error'); }
    finally{ btn.disabled=false; btn.textContent='✨ Generate Prompts'; }
  },
  async genGeminiImg() {
    const prompt=$('custom-prompt').value.trim();
    if(!prompt){ toast('Enter a prompt first','warn'); return; }
    const btn=$('btn-gemini-image'), out=$('gemini-image-output');
    btn.disabled=true; btn.textContent='⏳…'; out.innerHTML='<div class="spinner" style="margin:2rem auto"></div>';
    try{
      const dataUrl=await callGeminiImg(prompt);
      out.innerHTML=`<div class="gen-img-wrap"><img src="${dataUrl}" alt="Generated" class="gen-img"/>
        <div class="gen-img-actions">
          <a href="${dataUrl}" download="tbb-image.png" class="btn btn-primary btn-sm">⬇ Download</a>
          <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(document.querySelector('.gen-img').src).then(()=>toast('URL copied','success'))">📋 Copy</button>
        </div></div>`;
      toast('Image ready!','success');
    }catch(e){ out.innerHTML=`<p style="color:var(--danger)">${esc(e.message)}</p>`; toast('Image failed: '+e.message,'error'); }
    finally{ btn.disabled=false; btn.textContent='🎨 Generate with Gemini'; }
  },
  async genSocial() {
    const p=S.post, btn=$('btn-gen-social'), grid=$('social-grid');
    btn.disabled=true; btn.textContent='⏳…'; grid.innerHTML='<div class="spinner"></div>';
    try{
      const raw=await callGemini(Prompts.social(p));
      let sc; try{ sc=JSON.parse(raw.replace(/```json\n?|```/g,'').trim()); }catch{ sc={}; }
      const pls=[{k:'whatsapp',ic:'💬',lb:'WhatsApp'},{k:'twitter',ic:'🐦',lb:'Twitter/X'},{k:'facebook',ic:'📘',lb:'Facebook'},{k:'linkedin',ic:'💼',lb:'LinkedIn'},{k:'telegram',ic:'✈️',lb:'Telegram'},{k:'instagram',ic:'📸',lb:'Instagram'}];
      grid.innerHTML=pls.map(pl=>{
        const text=(sc[pl.k]||'(not generated)').replace(/\[URL\]/g,p.url);
        return `<div class="social-card"><div class="social-card-hdr"><span class="social-icon">${pl.ic}</span><span class="social-name">${pl.lb}</span>
          <button class="btn btn-sm btn-ghost" onclick="navigator.clipboard.writeText(${JSON.stringify(text)}).then(()=>toast('Copied!','success'))">📋</button></div>
          <div class="social-text">${esc(text)}</div></div>`;
      }).join('');
      toast('Social content ready!','success');
    }catch(e){ grid.innerHTML=`<p style="color:var(--danger)">${esc(e.message)}</p>`; toast('Failed: '+e.message,'error'); }
    finally{ btn.disabled=false; btn.textContent='📱 Generate All Social Content'; }
  },
  async genSchema() {
    const p=S.post, type=$q('.spill.active[data-schema]')?.dataset.schema||'auto';
    const btn=$('btn-gen-schema'), out=$('schema-output');
    btn.disabled=true; btn.textContent='⏳…'; out.innerHTML='<div class="spinner"></div>';
    try{
      const schema=await callGemini(Prompts.schema(p,type));
      out.innerHTML=`<div class="schema-wrap"><pre class="schema-pre"><code>${esc(schema)}</code></pre>
        <div class="schema-actions">
          <button class="btn btn-primary btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(schema)}).then(()=>toast('Schema copied!','success'))">📋 Copy Schema</button>
          <a href="https://validator.schema.org/" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">🔍 Validate →</a>
        </div></div>`;
      toast('Schema ready!','success');
    }catch(e){ out.innerHTML=`<p style="color:var(--danger)">${esc(e.message)}</p>`; toast('Failed: '+e.message,'error'); }
    finally{ btn.disabled=false; btn.textContent='🗂️ Generate Schema'; }
  },
};

// ── PROMPTS ───────────────────────────────────────────────────
const Prompts = {
  rewrite(p, an, mode, opts) {
    const lang=p._lg==='ms'?'Bahasa Malaysia':'English';
    const avgW=an?.competitorAvgWords||Math.max(p._w,1200);
    const tgtW={plus15:Math.round(avgW*1.15),plus30:Math.round(avgW*1.3),min1500:Math.max(avgW,1500),match:avgW}[S.cfg.wcTarget]||Math.round(avgW*1.15);
    const eff=mode==='smart'?(p._s<=35?'full':p._s<=65?'expand':'refresh'):mode;
    const modeStr={full:'Completely rewrite from scratch. Keep title keyword. All new content.',expand:'Keep structure, expand every section, add new H2s for missing topics.',refresh:'Update all statistics/dates to 2026. Add a "Latest Updates" section.',micro:'Minor fixes: grammar, update 2-3 stats, strengthen intro.'}[eff];
    return `You are an expert SEO writer for thebukitbesi.com (Malaysian lifestyle blog). Beat the current Google top 3.

TASK: ${modeStr}
TITLE: "${p.title}"
LANGUAGE: ${lang} — write ENTIRELY in ${lang}
TARGET: ${tgtW}+ words (current: ${p._w})
${p._g?`GSC: position ${p._g.position.toFixed(1)}, ${p._g.impressions} impressions`:''}

CONTENT GAPS TO FILL:
${(an?.gaps||[]).length?(an.gaps.map(g=>'- '+g).join('\n')):'- Expand comprehensively with Malaysia-specific details'}

UNIQUE ANGLES TO STRENGTHEN:
${(an?.unique||[]).length?(an.unique.map(u=>'- '+u).join('\n')):'- Add local Malaysian context: Ringgit prices, local brands, place names'}

REQUIREMENTS:
1. Target keyword in first paragraph, 2+ H2s, and conclusion
${opts.snippet?'2. Add "Quick Answer" box (40-60 words) at top for featured snippet':'2. Start with a compelling hook'}
3. Include 2026 statistics with attribution
4. E-E-A-T signals: first-person experience, specific examples
${opts.local?'5. Malaysian context: RM prices, local brands, cities, cultural references':''}
${opts.faq?'6. FAQ section at end: 5 specific Q&As (not generic)':''}
7. Suggest 3 internal links as [INTERNAL LINK: anchor → topic]
8. H2/H3 every 200-300 words

OUTPUT: HTML body only. Use <h2>,<h3>,<p>,<ul>,<ol>,<strong>,<em>. No <html>/<head>/<body>.

ORIGINAL (improve upon this — do not copy):
${Score.strip(p.content||'').slice(0,2000)}`;
  },
  analysis(p, compContent) {
    return `Analyze this post vs competitors. Return ONLY valid JSON, no markdown:
{"gaps":["topic competitors cover that this post misses"],"unique":["what this post has that competitors don't"],"competitorAvgWords":1500,"featuredSnippetOpportunity":"describe opportunity","keywordSuggestions":["kw1","kw2"]}

POST: "${p.title}"
EXCERPT: ${Score.strip(p.content||'').slice(0,1000)}
COMPETITORS:
${compContent.slice(0,2500)}`;
  },
  imgPrompts(p, style) {
    const styles={photorealistic:'ultra-realistic photography, DSLR, natural lighting',illustrated:'vector illustration, editorial, vibrant colors',infographic:'data visualization, charts and icons, clean layout',thumbnail:'blog thumbnail, bold composition, text overlay space, high contrast'};
    return `Create 3 image prompts for: "${p.title}"
Style: ${styles[style]||style}
Context: ${p._lg==='ms'?'Malaysian Malay blog':'English blog about Malaysia'}
Return ONLY a JSON array of 3 strings (50-80 words each, Malaysian context where relevant):
["prompt1","prompt2","prompt3"]`;
  },
  social(p) {
    const lang=p._lg==='ms'?'Bahasa Malaysia':'English';
    return `Social media content for this blog post. Return ONLY valid JSON, no markdown:
{"whatsapp":"message with [URL]","twitter":"tweet <260 chars with hashtags and [URL]","facebook":"2-3 paragraph post with [URL]","linkedin":"professional post with [URL]","telegram":"bullet-point summary with [URL]","instagram":"caption with emojis and 8-10 hashtags (no URL)"}
POST: "${p.title}"
LANGUAGE: ${lang} — write ALL content in ${lang}
EXCERPT: ${Score.strip(p.content||'').slice(0,300)}`;
  },
  schema(p, type) {
    return `Generate JSON-LD schema for this post. Type: ${type==='auto'?'auto-detect best':type}.
POST: "${p.title}" | URL: "${p.url}" | Published: "${p.published}" | Updated: "${p.updated||p.published}" | Words: ${p._w}
HEADINGS: ${(p._hd||[]).join(', ')}
EXCERPT: ${Score.strip(p.content||'').slice(0,500)}
Return ONLY the complete <script type="application/ld+json">...</script> tag.`;
  },
};

// ── BATCH QUEUE ───────────────────────────────────────────────
const Queue = {
  add(p) {
    if(!p) return;
    if(S.queue.some(x=>x.id===p.id)){ toast('Already queued','info'); return; }
    S.queue.push(p); Dash.stats(); this.render(); Dash.render();
    toast(`"${p.title.slice(0,40)}…" added to queue`,'success');
  },
  remove(id) {
    S.queue=S.queue.filter(p=>p.id!==id);
    Dash.stats(); this.render(); Dash.render();
  },
  addAll(filter) {
    const sm=S.cfg.staleMonths||6;
    const ps=filter==='urgent'?S.posts.filter(p=>p._s<=35):S.posts.filter(p=>p._mo>=sm);
    ps.forEach(p=>{ if(!S.queue.some(x=>x.id===p.id)) S.queue.push(p); });
    Dash.stats(); this.render();
    toast(`${ps.length} posts added`,'success');
  },
  render() {
    const el=$('batch-queue');
    if(!S.queue.length){ el.innerHTML='<p class="muted-txt text-center">No posts queued. Add from dashboard.</p>'; return; }
    el.innerHTML=S.queue.map((p,i)=>`
      <div class="batch-item" data-id="${p.id}">
        <div class="bi-num">${i+1}</div>
        <div class="bi-body"><div class="bi-title">${esc(p.title)}</div>
          <div class="bi-meta"><span class="badge badge-muted">Score:${p._s}</span><span class="badge badge-muted">${p._w}w</span>
          <span class="bi-status" id="bst-${p.id}">⏳ Waiting</span></div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="Queue.remove('${p.id}')">✕</button>
      </div>`).join('');
  },
  async run() {
    if(S.batching||!S.queue.length) return;
    S.batching=true;
    const btn=$('btn-run-batch'); btn.disabled=true; btn.textContent='⏳ Running…';
    const log=$('batch-log');
    log.innerHTML='<div class="blog-hdr">Batch Log</div>';
    const addLog=(m,t='info')=>{ log.innerHTML+=`<div class="log-line log-${t}">[${new Date().toLocaleTimeString()}] ${esc(m)}</div>`; log.scrollTop=log.scrollHeight; };
    for(const p of [...S.queue]) {
      const st=$('bst-'+p.id); if(st) st.textContent='⚡ Processing…';
      addLog(`Processing: "${p.title.slice(0,50)}…"`);
      try{
        const html=await callGemini(Prompts.rewrite(p,null,S.cfg.rewriteMode||'smart',{faq:true,local:true,snippet:true}));
        await BlogAPI.update(p.id,{content:html,updated:new Date().toISOString()});
        p.content=html; Score.calc(p);
        if(st) st.textContent=`✅ Done (score:${p._s})`;
        addLog(`✅ Done — new score: ${p._s}`,'success');
        await wait(2500);
      }catch(e){
        if(st) st.textContent='❌ Failed';
        addLog(`❌ ${e.message}`,'error');
        await wait(1000);
      }
    }
    localStorage.setItem(LS.POSTS,JSON.stringify(S.posts));
    S.batching=false; Dash.stats(); Dash.render();
    addLog('Batch complete!','success');
    toast('Batch complete!','success');
    btn.textContent=`▶ Start Batch (${S.queue.length})`; btn.disabled=!S.queue.length;
  },
};
window.Queue = Queue;

// ── EVENTS ────────────────────────────────────────────────────
function bind() {
  // Nav
  $a('.nav-item').forEach(n=>n.addEventListener('click',()=>showView(n.dataset.view)));
  // Auth
  $('btn-login').addEventListener('click',()=>Auth.init());
  $('btn-logout').addEventListener('click',()=>Auth.signOut());
  $('link-settings-login').addEventListener('click',e=>{ e.preventDefault(); $('login-screen').classList.add('hidden'); $('app').classList.remove('hidden'); showView('settings'); });
  // Theme
  $('btn-theme').addEventListener('click',toggleTheme);
  // Dashboard
  $('btn-refresh-posts').addEventListener('click',()=>Dash.load(true));
  $('btn-sync-gsc').addEventListener('click',()=>GSCAPI.sync());
  $('btn-start-batch').addEventListener('click',()=>showView('batch'));
  $('filter-tabs').addEventListener('click',e=>{ const t=e.target.closest('.ftab'); if(!t) return; S.filter=t.dataset.filter; $a('.ftab').forEach(f=>f.classList.toggle('active',f===t)); Dash.render(); });
  $('post-search').addEventListener('input',e=>{ S.q=e.target.value; Dash.render(); });
  $('sort-select').addEventListener('change',e=>{ S.sort=e.target.value; Dash.render(); });
  // Optimizer
  $('btn-back-dashboard').addEventListener('click',()=>showView('dashboard'));
  $a('.otab').forEach(t=>t.addEventListener('click',()=>{
    $a('.otab').forEach(x=>x.classList.toggle('active',x===t));
    $a('.opt-panel').forEach(p=>{ p.classList.toggle('active',p.id===`panel-${t.dataset.tab}`); p.classList.toggle('hidden',p.id!==`panel-${t.dataset.tab}`); });
  }));
  $('btn-fetch-competitors').addEventListener('click',()=>Opt.fetchCompetitors());
  $('btn-run-analysis').addEventListener('click',()=>Opt.fetchCompetitors());
  $('mode-selector').addEventListener('click',e=>{ const b=e.target.closest('.mbtn'); if(!b) return; $a('.mbtn').forEach(x=>x.classList.toggle('active',x===b)); });
  $('btn-generate-rewrite').addEventListener('click',()=>Opt.generateRewrite());
  $('btn-publish-rewrite').addEventListener('click',()=>Opt.publish());
  $('btn-regenerate').addEventListener('click',()=>Opt.generateRewrite());
  $('btn-copy-html').addEventListener('click',()=>{ if(!S.rewrite) return; navigator.clipboard.writeText(S.rewrite).then(()=>toast('HTML copied!','success')); });
  $('btn-edit-manual').addEventListener('click',()=>{
    const el=$('diff-rewrite');
    const on=el.contentEditable==='true';
    el.contentEditable=on?'false':'true';
    el.style.outline=on?'none':'2px solid var(--accent)';
    if(!on) toast('Edit mode ON — click again to lock','info');
    else { S.rewrite=el.innerText; toast('Edit locked','info'); }
  });
  $('btn-schedule').addEventListener('click',()=>toast('Copy the HTML → create Blogger draft → paste in HTML mode → set publish date','info',7000));
  $('style-pills').addEventListener('click',e=>{ const p=e.target.closest('.spill[data-style]'); if(!p) return; $a('.spill[data-style]').forEach(x=>x.classList.toggle('active',x===p)); });
  $('btn-gen-prompts').addEventListener('click',()=>Opt.genPrompts());
  $('btn-gemini-image').addEventListener('click',()=>Opt.genGeminiImg());
  $('btn-gen-social').addEventListener('click',()=>Opt.genSocial());
  $('schema-type-pills').addEventListener('click',e=>{ const p=e.target.closest('.spill[data-schema]'); if(!p) return; $a('.spill[data-schema]').forEach(x=>x.classList.toggle('active',x===p)); });
  $('btn-gen-schema').addEventListener('click',()=>Opt.genSchema());
  // Batch
  $('btn-add-urgent-batch').addEventListener('click',()=>Queue.addAll('urgent'));
  $('btn-add-stale-batch').addEventListener('click',()=>Queue.addAll('stale'));
  $('btn-run-batch').addEventListener('click',()=>Queue.run());
  // Settings
  $('btn-save-settings').addEventListener('click',()=>Cfg.save());
  $('btn-clear-settings').addEventListener('click',()=>Cfg.clear());
  // Modal
  $('modal-overlay').addEventListener('click',e=>{ if(e.target===$('modal-overlay')) closeModal(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });
}

// ── INIT ──────────────────────────────────────────────────────
function init() {
  Cfg.load(); initTheme(); Cfg.populate(); bind();
}
document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',init) : init();
