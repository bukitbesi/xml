/* The Bukit Besi runtime 2.3.0 — consolidated production runtime. Zero jQuery. */
(() => {
  'use strict';

  const script = document.currentScript;
  const one = (s, root = document) => root.querySelector(s);
  const all = (s, root = document) => Array.from(root.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const setting = (text, key) => String(text || '').match(new RegExp('\\$' + key + '=\\{([^}]*)\\}', 'i'))?.[1].trim() || '';
  const safeURL = (value, base = location.href) => {
    if (!value) return '';
    try { const u = new URL(value, base); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; }
  };

  const cfg = typeof pbt === 'object' && pbt ? pbt : {};
  const blogURL = safeURL(script?.dataset.blogUrl || one('link[rel="canonical"]')?.href) || location.href;
  const origin = new URL(blogURL).origin;
  const fallbackImage = safeURL(typeof noThumbnail === 'string' ? noThumbnail : cfg.noThumb, origin);
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let body, activePanel, returnFocus;
  let imageObserver;
  let jsonpId = 0;
  const watchedImages = new WeakSet();
  const requests = new Map();
  const jsonpRequests = new Map();

  function searchURL(label = '', query = '') {
    const u = new URL(label && !['recent','random'].includes(label) ? '/search/label/' + encodeURIComponent(label) : '/search', origin);
    if (query) u.searchParams.set('q', query);
    return u.href;
  }

  function resizedImage(value, width = 720, height = 405) {
    const raw = safeURL(value, origin);
    if (!raw) return '';
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (host === 'resources.blogblog.com') return fallbackImage && fallbackImage !== raw ? resizedImage(fallbackImage,width,height) : raw;
    if (!/(^|\.)(googleusercontent\.com|blogspot\.com|ggpht\.com)$/.test(host)) return raw;
    const size = `w${Math.round(width)}-h${Math.round(height)}-p-k-no-nu-rw`;
    u.pathname = u.pathname.replace(/\/(?:s\d+(?:-[a-z0-9-]+)?|w\d+(?:-h\d+)?(?:-[a-z0-9-]+)?)\//i,'/' + size + '/');
    let href = u.href;
    if (/\/img\/a\/|\/blogger_img_proxy\//.test(u.pathname) || /=(?:s|w)\d+/i.test(href)) {
      href = href.replace(/=(?:s\d+|w\d+(?:-h\d+)?)(?:-[a-z0-9-]+)?(?:$|(?=[?#]))/i,'=' + size);
    }
    return href;
  }

  function loadBackground(el, important = false) {
    if (!el?.isConnected || el.dataset.tbbLoading) return;
    const source = safeURL(el.dataset.src, origin) || fallbackImage;
    if (!source) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(320, Math.min(1280, Math.ceil((rect.width || 360) * ratio / 40) * 40));
    const height = Math.max(180, Math.round(width * (rect.height && rect.width ? rect.height / rect.width : 0.5625)));
    const candidates = [...new Set([resizedImage(source,width,height), source, resizedImage(fallbackImage,width,height)].filter(Boolean))];
    const img = new Image();
    img.decoding = 'async';
    if (important) img.fetchPriority = 'high';
    el.dataset.tbbLoading = '1';
    img.onload = () => {
      el.dataset.src = img.src;
      el.style.backgroundImage = 'url(' + JSON.stringify(img.src) + ')';
      el.style.opacity = '1';
      el.classList.add('pbt-lazy');
      delete el.dataset.tbbLoading;
    };
    img.onerror = () => {
      if (candidates.length) img.src = candidates.shift();
      else delete el.dataset.tbbLoading;
    };
    img.src = candidates.shift();
  }

  function images(root = document, eager = false) {
    all('.thumbnail[data-src],.avatar[data-src]', root).forEach(el => {
      if (watchedImages.has(el) && el.classList.contains('pbt-lazy')) return;
      watchedImages.add(el);
      const r = el.getBoundingClientRect();
      const visible = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
      if (visible || eager || !('IntersectionObserver' in window)) {
        loadBackground(el, visible && !!el.closest('.featured .first'));
      } else {
        imageObserver ||= new IntersectionObserver(entries => entries.forEach(e => {
          if (e.isIntersecting) { loadBackground(e.target); imageObserver.unobserve(e.target); }
        }), {rootMargin:'240px'});
        imageObserver.observe(el);
      }
    });
  }

  function mapEntry(entry) {
    const doc = new DOMParser().parseFromString(entry.summary?.$t || entry.content?.$t || '', 'text/html');
    all('script,style,noscript',doc).forEach(el => el.remove());
    const url = safeURL(entry.link?.find(l => l.rel === 'alternate')?.href, origin);
    const rawThumb = entry.media$thumbnail?.url || one('img',doc)?.getAttribute('src') || '';
    const thumb = resizedImage(rawThumb,720,405) || fallbackImage;
    const published = entry.published?.$t || '';
    const date = new Date(published);
    let dateLabel = '';
    if (!Number.isNaN(date.getTime())) {
      try { dateLabel = date.toLocaleDateString((document.documentElement.lang || 'ms-MY').replaceAll('_','-'),{day:'2-digit',month:'long'}); }
      catch { dateLabel = date.toLocaleDateString('ms-MY',{day:'2-digit',month:'long'}); }
    }
    return {
      id:(entry.id?.$t || '').split('post-').pop(),
      url,
      thumb,
      title:entry.title?.$t || cfg.noTitle || 'Untitled',
      author:entry.author?.[0]?.name?.$t || '',
      category:entry.category?.[0]?.term || '',
      summary:(doc.body?.textContent || '').replace(/\s+/g,' ').trim().slice(0,240),
      published:Number.isNaN(date.getTime()) ? '' : date.toISOString(),
      date:dateLabel
    };
  }

  function jsonpFeed(label, count, query = '') {
    const u = new URL('/feeds/posts/default' + (label && !['recent','random'].includes(label) ? '/-/' + encodeURIComponent(label) : ''), origin);
    u.searchParams.set('alt','json-in-script');
    u.searchParams.set('max-results',String(Math.max(1,Math.min(30,count))));
    if (query) u.searchParams.set('q',query);
    const key = u.href;
    if (jsonpRequests.has(key)) return jsonpRequests.get(key);
    const pending = new Promise((resolve,reject) => {
      const cb = '__tbbFeed23_' + Date.now().toString(36) + '_' + (++jsonpId);
      const tag = document.createElement('script');
      let done = false;
      const cleanup = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        tag.remove();
        try { delete window[cb]; } catch { window[cb] = undefined; }
      };
      const timer = setTimeout(() => { cleanup(); reject(new Error('Blogger JSONP timeout')); },12000);
      window[cb] = data => {
        try {
          if (!data?.feed) throw new Error('Invalid Blogger feed');
          const posts = (data.feed.entry || []).map(mapEntry).filter(p => p.url);
          cleanup(); resolve(posts);
        } catch (error) { cleanup(); reject(error); }
      };
      u.searchParams.set('callback',cb);
      tag.async = true;
      tag.src = u.href;
      tag.referrerPolicy = 'strict-origin-when-cross-origin';
      tag.onerror = () => { cleanup(); reject(new Error('Blogger JSONP failed')); };
      document.head.append(tag);
    }).finally(() => jsonpRequests.delete(key));
    jsonpRequests.set(key,pending);
    return pending;
  }

  async function requestFeed(label, count, query = '', signal) {
    const u = new URL('/feeds/posts/default' + (label && !['recent','random'].includes(label) ? '/-/' + encodeURIComponent(label) : ''), origin);
    u.searchParams.set('alt','json');
    u.searchParams.set('max-results',String(Math.max(1,Math.min(30,count))));
    if (query) u.searchParams.set('q',query);
    const key = u.href;
    if (!signal && requests.has(key)) return requests.get(key);
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort',abort,{once:true});
    const timeout = setTimeout(abort,9000);
    const pending = (async () => {
      try {
        const response = await fetch(u.href,{signal:controller.signal,credentials:'omit'});
        if (!response.ok) throw new Error('Feed HTTP ' + response.status);
        const json = await response.json();
        if (!json.feed) throw new Error('Invalid Blogger feed');
        return (json.feed.entry || []).map(mapEntry).filter(p => p.url);
      } catch (error) {
        if (signal?.aborted) throw error;
        return jsonpFeed(label,count,query);
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener('abort',abort);
      }
    })();
    if (!signal) {
      requests.set(key,pending);
      pending.finally(() => requests.delete(key));
    }
    return pending;
  }

  function card(p,{classes='',overlay=false,full=false}={}) {
    const category = full && cfg.postCategory !== false && p.category ? `<span class="entry-tag">${esc(p.category)}</span>` : '';
    const author = full && cfg.postAuthor !== false && p.author ? `<span class="entry-author"><span class="author-name">${esc(p.author)}</span></span>` : '';
    const date = cfg.postDate !== false && p.published ? `<span class="entry-time"><time datetime="${esc(p.published)}">${esc(p.date)}</time></span>` : '';
    const meta = author || date ? `<div class="entry-meta">${author}${date}</div>` : '';
    const thumb = `<div class="thumbnail" data-src="${esc(p.thumb)}"></div>`;
    const summary = full && !overlay && cfg.postSummary !== false && p.summary ? `<p class="entry-excerpt excerpt">${esc(p.summary)}</p>` : '';
    const heading = `<div class="entry-header">${category}<h2 class="entry-title">${overlay ? esc(p.title) : `<a href="${esc(p.url)}">${esc(p.title)}</a>`}</h2>${summary}${meta}</div>`;
    return `<article class="post ${classes}${overlay ? ' card cs' : ''}">${overlay ? `<a class="entry-inner" href="${esc(p.url)}"><span class="entry-thumbnail">${thumb}</span>${heading}</a>` : `<a class="entry-thumbnail" href="${esc(p.url)}" aria-label="${esc(p.title)}">${thumb}</a>${heading}`}</article>`;
  }

  function render(posts,type) {
    const first = posts[0];
    if (!first) return `<span class="error-msg" role="status">${esc(cfg.noResults || 'Tiada hasil ditemui')}</span>`;
    const rest = posts.slice(1);
    const list = (items,opts) => items.map(p => card(p,opts)).join('');
    if (type === 'featured') return `<div class="featured-items container">${card(first,{classes:'first cs',full:true})}<div class="grid">${list(rest,{classes:'cs'})}</div></div>`;
    if (type === 'block1') return `<div class="block1-items">${card(first,{classes:'first',full:true})}<div class="block1-list">${list(rest)}</div></div>`;
    if (type === 'block2') return `<div class="block2-items">${card(first,{overlay:true,full:true})}<div class="block2-grid">${list(rest,{full:true})}</div></div>`;
    if (type === 'story') return `<div class="story-items">${list(posts,{overlay:true,full:true})}</div>`;
    if (type === 'video') return `<div class="video-items">${card(first,{classes:'first',full:true})}<div class="video-grid">${list(rest)}</div></div>`;
    const allowed = ['grid','list','side','related','mega','search'];
    const actual = allowed.includes(type) ? type : 'grid';
    return `<div class="${actual}-items">${list(posts,{full:['grid','list'].includes(actual)})}</div>`;
  }

  function feedError(target,label,retry) {
    target.replaceChildren();
    const message = document.createElement('div');
    message.className = 'tbb-feed-error';
    message.setAttribute('role','status');
    const link = document.createElement('a');
    link.href = searchURL(label);
    link.textContent = 'Lihat artikel';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Cuba semula';
    button.className = 'btn';
    button.addEventListener('click',retry,{once:true});
    message.append('Artikel belum dapat dimuatkan. ',link,' ',button);
    target.append(message);
  }

  async function loadWidget(target,{label='recent',count=5,type='block1',exclude=''}={}) {
    if (!target?.isConnected || target.dataset.tbbState === 'loading') return;
    target.dataset.tbbState = 'loading';
    target.setAttribute('aria-busy','true');
    try {
      let posts = await requestFeed(label,count + (exclude ? 1 : 0));
      posts = posts.filter(p => p.id !== String(exclude));
      if (label === 'random') {
        posts = [...posts];
        for (let i=posts.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [posts[i],posts[j]]=[posts[j],posts[i]]; }
      }
      target.innerHTML = render(posts.slice(0,count),type);
      target.dataset.tbbState = 'loaded';
      images(target,true);
    } catch (error) {
      target.dataset.tbbState = 'error';
      feedError(target,label,() => { target.dataset.tbbState=''; loadWidget(target,{label,count,type,exclude}); });
      console.warn('TBB feed:',error);
    } finally { target.removeAttribute('aria-busy'); }
  }

  function initFeeds() {
    const jobs = new WeakMap();
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { jobs.get(e.target)?.(); observer.unobserve(e.target); }
    }),{rootMargin:'300px'}) : null;
    const queue = (target,opts) => {
      if (target.closest('.featured') || !observer) loadWidget(target,opts);
      else { jobs.set(target,() => loadWidget(target,opts)); observer.observe(target); }
    };
    all('.getPosts .widget-content[data-shortcode]').forEach(target => {
      const code = target.dataset.shortcode || '';
      const type = target.closest('.featured') ? 'featured' : target.closest('.sidebar,.footer,.site-footer') ? 'side' : setting(code,'type') || 'block1';
      const label = setting(code,'label') || 'recent';
      const defaults = {featured:4,block1:5,block2:5,story:3,video:5,side:4,grid:4,list:4,related:3,mega:5};
      const count = Math.max(1,Math.min(20,parseInt(setting(code,'results'),10) || defaults[type] || 4));
      target.closest('.widget')?.classList.add('type-' + (Object.prototype.hasOwnProperty.call(defaults,type) ? type : 'grid'));
      const link = target.closest('.widget')?.querySelector('.title-link');
      if (link) link.href = searchURL(label);
      queue(target,{label,count,type});
    });
    all('.related-wrap').forEach(wrap => {
      const tag = one('.related-tag',wrap), target = one('.widget-content',wrap);
      if (!tag || !target) return;
      const code = one('#related-posts .HTML')?.dataset.shortcode || '';
      const chosen = setting(code,'label');
      const label = chosen && chosen !== 'related' ? chosen : tag.dataset.label || 'recent';
      const count = Math.max(1,Math.min(20,parseInt(setting(code,'results'),10) || 3));
      const link = one('.title-link',wrap); if (link) link.href = searchURL(label);
      queue(target,{label,count,type:'related',exclude:tag.dataset.id});
    });
  }

  function menuTree(nav) {
    const items = Array.from(nav.children).filter(el => el.tagName === 'LI');
    const parents = [];
    items.forEach(li => {
      const link = one(':scope > a',li); if (!link) return;
      const text = link.textContent.trim();
      const depth = Math.min(text.match(/^_+/)?.[0].length || 0,2);
      link.textContent = text.replace(/^_+/,'');
      const parent = parents[depth-1];
      if (depth && parent) {
        let sub = one(':scope > ul.sub',parent);
        if (!sub) { sub=document.createElement('ul'); sub.className='ul sub sm-' + depth; parent.append(sub); }
        sub.append(li); parent.classList.add('has-sub');
      }
      parents[depth]=li; parents.length=depth+1;
    });
    nav.closest('.widget')?.classList.add('is-ready');
  }

  function initMenus() {
    all('.main-nav').forEach(menuTree);
    const source = one('.main-nav'), dest = one('.mobile-menu');
    if (source && dest && !dest.children.length) {
      const nav = source.cloneNode(true);
      nav.className = 'mobile-nav';
      all('[id]',nav).forEach(el => el.removeAttribute('id'));
      all('.mega',nav).forEach(el => el.remove());
      all('ul.sub',nav).forEach(ul => ul.className='sub');
      all('.has-sub > a',nav).forEach(a => {
        a.setAttribute('aria-expanded','false');
        a.addEventListener('click',event => {
          event.preventDefault();
          const on = a.parentElement.classList.toggle('expanded');
          a.setAttribute('aria-expanded',String(on));
        });
      });
      dest.append(nav);
    }
    const logo = one('.main-logo a'), slot = one('.mobile-logo');
    if (logo && slot && !slot.children.length) {
      const clone = logo.cloneNode(true); all('[id]',clone).forEach(el=>el.removeAttribute('id')); slot.append(clone);
    }
  }

  function panel(name,trigger) {
    const opening = !!name && activePanel !== name;
    body.classList.remove('menu-on','search-on','share-on');
    all('.menu-toggle').forEach(el => el.setAttribute('aria-expanded','false'));
    if (!opening) { activePanel=null; returnFocus?.focus(); return; }
    activePanel=name; returnFocus=trigger || document.activeElement;
    body.classList.add(name + '-on');
    if (name === 'menu') all('.menu-toggle').forEach(el=>el.setAttribute('aria-expanded','true'));
    requestAnimationFrame(() => one(name==='search'?'.main-search input':name==='menu'?'.hide-mobile-menu':'.share-modal button')?.focus());
  }

  function initPanels() {
    all('.menu-toggle').forEach(el=>el.addEventListener('click',()=>panel('menu',el)));
    all('.search-toggle').forEach(el=>el.addEventListener('click',()=>panel('search',el)));
    all('.share-toggle,.post-share .show-more button').forEach(el=>el.addEventListener('click',()=>panel('share',el)));
    all('.overlay-bg,.hide-mobile-menu,.main-search .close,.hide-modal').forEach(el=>el.addEventListener('click',()=>panel(null)));
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&activePanel) panel(null); });
  }

  function initDarkMode() {
    const root=document.documentElement;
    const stored=storage.get('tbb_dark_mode') ?? storage.get('dark_mode');
    if(cfg.isDark===true || stored==='true') root.classList.add('is-dark');
    const sync=()=>all('.darkmode-toggle').forEach(el=>el.setAttribute('aria-pressed',String(root.classList.contains('is-dark'))));
    sync();
    all('.darkmode-toggle').forEach(el=>el.addEventListener('click',()=>{ root.classList.toggle('is-dark'); storage.set('tbb_dark_mode',String(root.classList.contains('is-dark'))); sync(); }));
  }

  function initScroll() {
    const header=one('.header-inner'), buttons=all('.to-top');
    let previous=scrollY,ticking=false;
    const update=()=>{
      const y=scrollY;
      if(header && cfg.stickyMenu!==false){ const fixed=y>header.offsetHeight*2; header.classList.toggle('is-fixed',fixed); header.classList.toggle('show',fixed&&y<previous); }
      buttons.forEach(el=>el.classList.toggle('show',y>=100)); previous=y; ticking=false;
    };
    addEventListener('scroll',()=>{ if(!ticking){ticking=true;requestAnimationFrame(update);} },{passive:true});
    buttons.forEach(el=>el.addEventListener('click',()=>scrollTo({top:0,behavior:reducedMotion()?'auto':'smooth'})));
  }

  function initSearch() {
    const box=one('.main-search'), input=box&&one('input',box), results=box&&one('.search-results',box), content=box&&one('.search-content',box);
    if(!input||!results||!content)return;
    results.setAttribute('aria-live','polite');
    let timer,controller,version=0;
    input.addEventListener('keydown',e=>{ if(e.key==='Enter'&&input.value.trim()){e.preventDefault();location.href=searchURL('',input.value.trim());} });
    input.addEventListener('input',()=>{
      clearTimeout(timer); controller?.abort(); const current=++version,query=input.value.trim();
      results.replaceChildren(); content.classList.toggle('visible',!!query); if(!query)return;
      timer=setTimeout(async()=>{
        controller=new AbortController(); box.classList.add('loading');
        try{const posts=await requestFeed('recent',8,query,controller.signal);if(current!==version)return;results.innerHTML=render(posts,'search');images(results,true);}
        catch(error){if(current===version&&error.name!=='AbortError')results.textContent='Carian belum dapat dimuatkan.';}
        finally{if(current===version)box.classList.remove('loading');}
      },300);
    });
  }

  function initLoadMore() {
    const button=one('#load-more'),target=one('.blog-posts'); if(!button||!target)return;
    button.addEventListener('click',async e=>{
      e.preventDefault(); if(button.dataset.busy)return;
      const url=safeURL(button.dataset.url||button.href,origin); if(!url||new URL(url).origin!==origin)return;
      button.dataset.busy='1';
      try{
        const response=await fetch(url,{credentials:'omit'}); if(!response.ok)throw new Error('Pagination HTTP '+response.status);
        const doc=new DOMParser().parseFromString(await response.text(),'text/html');
        const incoming=one('.blog-posts',doc),next=one('#load-more',doc); if(!incoming)throw new Error('Missing posts');
        const existing=new Set(all(':scope > .post .entry-title a',target).map(a=>a.href));
        all(':scope > .post:not(.ad-type)',incoming).forEach(post=>{const link=one('.entry-title a',post)?.href;if(link&&existing.has(link))return;all('script',post).forEach(el=>el.remove());target.append(document.importNode(post,true));});
        images(target,true);
        const nextURL=safeURL(next?.dataset.url||next?.getAttribute('href'),url); if(nextURL&&nextURL!==url){button.dataset.url=nextURL;button.href=nextURL;}else button.remove();
      }catch{location.href=url;}finally{delete button.dataset.busy;}
    });
  }

  function initCopy() {
    all('.copy-link').forEach(box=>{const input=one('input',box),button=one('button',box);if(!input||!button)return;button.addEventListener('click',async()=>{let copied=false;try{await navigator.clipboard.writeText(input.value);copied=true;}catch{input.focus();input.select();try{copied=document.execCommand('copy');}catch{}}if(copied){box.classList.add('copied');setTimeout(()=>box.classList.remove('copied'),2500);}});});
  }

  function initContent() {
    all('.post-body img').forEach(img=>{img.decoding='async';if(!img.hasAttribute('loading')&&img.getBoundingClientRect().top>=innerHeight)img.loading='lazy';});
    all('.post-body table').forEach(table=>{if(table.parentElement?.classList.contains('table-responsive-wrapper'))return;const wrap=document.createElement('div');wrap.className='table-responsive-wrapper';table.before(wrap);wrap.append(table);});
    all('a.window-open').forEach(link=>{if(!safeURL(link.getAttribute('href')))return;link.target='_blank';link.rel='noopener noreferrer';});
  }

  function addVisualCSS() {
    if(document.getElementById('tbb-v230-css'))return;
    const style=document.createElement('style');
    style.id='tbb-v230-css';
    style.textContent=`
      .content-section .widget.type-story{overflow:hidden}
      .content-section .type-story>.widget-content{overflow-x:auto;overscroll-behavior-inline:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
      .content-section .story-items{align-items:stretch}
      .content-section .story-items .post{aspect-ratio:4/5;min-height:0}
      .content-section .story-items .card .entry-header{padding:1rem;gap:.5rem}
      .content-section .story-items .entry-title{font-size:1rem;line-height:1.3;-webkit-line-clamp:3}
      @media(max-width:680px){.content-section .story-items{grid-template-columns:repeat(3,minmax(9.75rem,9.75rem));gap:.75rem;width:max-content;max-width:none;padding:0}.content-section .story-items .card .entry-header{padding:.875rem}.content-section .story-items .entry-title{font-size:.95rem;line-height:1.28;-webkit-line-clamp:3}}
      @media(max-width:390px){.content-section .story-items{grid-template-columns:repeat(3,minmax(9rem,9rem))}}
    `;
    document.head.append(style);
  }

  function start() {
    body=document.body;
    if(!body||body.dataset.tbbRuntime==='2.3.0')return;
    body.dataset.tbbRuntime='2.3.0';
    addVisualCSS();
    [initMenus,initPanels,initDarkMode,initScroll,images,initFeeds,initSearch,initLoadMore,initCopy,initContent].forEach(init=>{try{init();}catch(error){console.error('TBB '+init.name,error);}});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
