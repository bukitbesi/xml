/* The Bukit Besi runtime 2.2.1. Native browser APIs. */
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
  const cfg = typeof pbt === 'object' ? pbt : {};
  const blogURL = safeURL(script?.dataset.blogUrl || one('link[rel="canonical"]')?.href) || location.href;
  const origin = new URL(blogURL).origin;
  const searchURL = (label = '', query = '') => {
    const u = new URL(label && !['recent','random'].includes(label) ? '/search/label/' + encodeURIComponent(label) : '/search', origin);
    if (query) u.searchParams.set('q', query);
    return u.href;
  };
  const fallbackImage = safeURL(typeof noThumbnail === 'string' ? noThumbnail : cfg.noThumb);
  const storage = { get(key) { try { return localStorage.getItem(key); } catch { return null; } }, set(key, value) { try { localStorage.setItem(key, value); } catch {} } };
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let body, activePanel, returnFocus;

  function resizedImage(value, width, height) {
    const raw = safeURL(value);
    if (!raw) return '';
    const u = new URL(raw);
    if (u.hostname === 'resources.blogblog.com') return fallbackImage === raw ? raw : resizedImage(fallbackImage, width, height);
    if (!/(^|\.)(googleusercontent\.com|bp\.blogspot\.com|ggpht\.com)$/.test(u.hostname)) return raw;
    const size = `w${Math.round(width)}-h${Math.round(height)}-p-k-no-nu-rw`;
    u.pathname = u.pathname.replace(/\/(?:s\d+|w\d+(?:-h\d+)?)(?:-[\w]+)*\//, '/' + size + '/');
    if (/\/img\/a\/|\/blogger_img_proxy\//.test(u.pathname)) {
      u.pathname = u.pathname.replace(/=(?:s\d+|w\d+)[\w-]*$/, '') + '=' + size;
    }
    return u.href;
  }

  const watchedImages = new WeakSet();
  let imageObserver;
  function loadBackground(el, important = false) {
    if (!el.isConnected || el.classList.contains('pbt-lazy') || el.dataset.tbbLoading) return;
    const source = safeURL(el.dataset.src) || fallbackImage;
    if (!source) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(160, Math.min(1280, Math.ceil((rect.width || 320) * ratio / 40) * 40));
    const height = Math.max(90, Math.round(width * (rect.height && rect.width ? rect.height / rect.width : 0.625)));
    const candidates = [...new Set([resizedImage(source, width, height), source, resizedImage(fallbackImage, width, height)].filter(Boolean))];
    const img = new Image();
    img.decoding = 'async';
    if (important) img.fetchPriority = 'high';
    el.dataset.tbbLoading = '1';
    img.onload = () => {
      el.style.backgroundImage = 'url(' + JSON.stringify(img.src) + ')';
      el.classList.add('pbt-lazy');
      delete el.dataset.tbbLoading;
    };
    img.onerror = () => { if (candidates.length) img.src = candidates.shift(); else delete el.dataset.tbbLoading; };
    img.src = candidates.shift();
  }
  function images(root = document, eager = false) {
    all('.thumbnail[data-src],.avatar[data-src]', root).forEach(el => {
      if (watchedImages.has(el)) return;
      watchedImages.add(el);
      const r = el.getBoundingClientRect();
      const visible = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
      if (visible || eager || !('IntersectionObserver' in window)) loadBackground(el, visible && !!el.closest('.featured .first'));
      else {
        imageObserver ||= new IntersectionObserver(entries => entries.forEach(e => {
          if (e.isIntersecting) { loadBackground(e.target); imageObserver.unobserve(e.target); }
        }), {rootMargin:'240px'});
        imageObserver.observe(el);
      }
    });
  }

  const requests = new Map();
  async function requestFeed(label, count, query = '', signal) {
    const u = new URL('/feeds/posts/default' + (label && !['recent','random'].includes(label) ? '/-/' + encodeURIComponent(label) : ''), origin);
    u.searchParams.set('alt', 'json');
    u.searchParams.set('max-results', String(Math.max(1, Math.min(30, count))));
    if (query) u.searchParams.set('q', query);
    const key = u.href;
    if (!signal && requests.has(key)) return requests.get(key);
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, {once:true});
    const timeout = setTimeout(abort, 12000);
    const pending = (async () => {
      try {
        const response = await fetch(u.href, {signal:controller.signal, credentials:'omit'});
        if (!response.ok) throw new Error('Feed HTTP ' + response.status);
        const json = await response.json();
        if (!json.feed) throw new Error('Invalid Blogger feed');
        return (json.feed.entry || []).map(mapEntry).filter(p => p.url);
      } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
    })();
    if (!signal) {
      requests.set(key, pending);
      pending.catch(() => requests.delete(key));
    }
    return pending;
  }
  function mapEntry(entry) {
    const content = new DOMParser().parseFromString(entry.summary?.$t || entry.content?.$t || '', 'text/html');
    all('script,style,noscript',content).forEach(el => el.remove());
    const url = safeURL(entry.link?.find(l => l.rel === 'alternate')?.href, origin);
    const thumb = safeURL(entry.media$thumbnail?.url || one('img', content)?.getAttribute('src'), url || origin) || fallbackImage;
    const published = entry.published?.$t || '';
    const date = new Date(published);
    let dateLabel = '';
    if (!Number.isNaN(date.getTime())) {
      try { dateLabel = date.toLocaleDateString(document.documentElement.lang.replaceAll('_','-') || 'ms-MY', {day:'2-digit',month:'long'}); }
      catch { dateLabel = date.toLocaleDateString('ms-MY',{day:'2-digit',month:'long'}); }
    }
    return {
      id: (entry.id?.$t || '').split('post-').pop(), url, thumb,
      title: entry.title?.$t || cfg.noTitle || 'Untitled',
      author: entry.author?.[0]?.name?.$t || '',
      category: entry.category?.[0]?.term || '',
      summary: content.body.textContent.replace(/\s+/g, ' ').trim().slice(0, 240),
      published: Number.isNaN(date.getTime()) ? '' : date.toISOString(),
      date: dateLabel
    };
  }
  function card(p, {classes = '', overlay = false, full = false} = {}) {
    const category = full && cfg.postCategory !== false && p.category ? `<span class="entry-tag">${esc(p.category)}</span>` : '';
    const author = full && cfg.postAuthor !== false && p.author ? `<span class="entry-author"><span class="author-name">${esc(p.author)}</span></span>` : '';
    const date = cfg.postDate !== false && p.published ? `<span class="entry-time"><time datetime="${esc(p.published)}">${esc(p.date)}</time></span>` : '';
    const meta = author || date ? `<div class="entry-meta">${author}${date}</div>` : '';
    const thumb = `<div class="thumbnail" data-src="${esc(p.thumb)}"></div>`;
    const summary = full && !overlay && cfg.postSummary !== false && p.summary ? `<p class="entry-excerpt excerpt">${esc(p.summary)}</p>` : '';
    const heading = `<div class="entry-header">${category}<h2 class="entry-title">${overlay ? esc(p.title) : `<a href="${esc(p.url)}">${esc(p.title)}</a>`}</h2>${summary}${meta}</div>`;
    return `<article class="post ${classes}${overlay ? ' card cs' : ''}">${overlay ? `<a class="entry-inner" href="${esc(p.url)}"><span class="entry-thumbnail">${thumb}</span>${heading}</a>` : `<a class="entry-thumbnail" href="${esc(p.url)}" aria-label="${esc(p.title)}">${thumb}</a>${heading}`}</article>`;
  }
  function render(posts, type) {
    const first = posts[0];
    if (!first) return `<span class="error-msg" role="status">${esc(cfg.noResults || 'Tiada hasil ditemui')}</span>`;
    const rest = posts.slice(1);
    const list = (items, options) => items.map(p => card(p, options)).join('');
    if (type === 'featured') return `<div class="featured-items container">${card(first,{classes:'first cs',full:true})}<div class="grid">${list(rest,{classes:'cs'})}</div></div>`;
    if (type === 'block1') return `<div class="block1-items">${card(first,{classes:'first',full:true})}<div class="block1-list">${list(rest)}</div></div>`;
    if (type === 'block2') return `<div class="block2-items">${card(first,{overlay:true,full:true})}<div class="block2-grid">${list(rest,{full:true})}</div></div>`;
    if (type === 'story') return `<div class="story-items">${list(posts,{overlay:true,full:true})}</div>`;
    if (type === 'video') return `<div class="video-items">${card(first,{classes:'first',full:true})}<div class="video-grid">${list(rest)}</div></div>`;
    const allowed = ['grid','list','side','related','mega','search'];
    return `<div class="${allowed.includes(type) ? type : 'grid'}-items">${list(posts,{full:['grid','list'].includes(type)})}</div>`;
  }
  function feedError(target, label, retry) {
    target.replaceChildren();
    const message = document.createElement('div');
    message.className = 'tbb-feed-error';
    message.setAttribute('role','status');
    const link = document.createElement('a');
    link.href = searchURL(label);
    link.textContent = 'Lihat artikel';
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = 'Cuba semula'; button.className = 'btn';
    button.addEventListener('click', retry, {once:true});
    message.append('Artikel belum dapat dimuatkan. ', link, ' ', button);
    target.append(message);
  }
  async function loadWidget(target, {label = 'recent', count = 5, type = 'block1', exclude = ''} = {}) {
    if (target.dataset.tbbState === 'loading' || target.dataset.tbbState === 'loaded') return;
    target.dataset.tbbState = 'loading'; target.setAttribute('aria-busy','true');
    try {
      let posts = await requestFeed(label, count + (exclude ? 1 : 0));
      posts = posts.filter(p => p.id !== String(exclude));
      if (label === 'random') {
        posts = [...posts];
        for (let i = posts.length-1; i > 0; i--) { const j = Math.floor(Math.random() * (i+1)); [posts[i],posts[j]] = [posts[j],posts[i]]; }
      }
      target.innerHTML = render(posts.slice(0,count), type);
      target.dataset.tbbState = 'loaded';
      images(target, true);
    } catch {
      target.dataset.tbbState = 'error';
      feedError(target,label,() => loadWidget(target,{label,count,type,exclude}));
    } finally { target.removeAttribute('aria-busy'); }
  }
  function initFeeds() {
    const jobs = new WeakMap();
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { jobs.get(e.target)?.(); observer.unobserve(e.target); }
    }), {rootMargin:'300px'}) : null;
    const queue = (target, opts) => {
      if (target.closest('.featured') || !observer) loadWidget(target,opts);
      else { jobs.set(target,() => loadWidget(target,opts)); observer.observe(target); }
    };
    all('.getPosts .widget-content[data-shortcode]').forEach(target => {
      const code = target.dataset.shortcode;
      const type = target.closest('.featured') ? 'featured' : target.closest('.sidebar,.footer,.site-footer') ? 'side' : setting(code,'type') || 'block1';
      const label = setting(code,'label') || 'recent';
      const defaults = {featured:4,block1:5,block2:5,story:3,video:5,side:4,grid:4,list:4};
      const count = Math.max(1,Math.min(20,parseInt(setting(code,'results'),10) || defaults[type] || 4));
      target.closest('.widget')?.classList.add('type-' + (Object.hasOwn(defaults,type) ? type : 'grid'));
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
      const link = one('.title-link',wrap); if (link) link.href = searchURL(label);
      queue(target,{label,count:Math.min(20,parseInt(setting(code,'results'),10) || 3),type:'related',exclude:tag.dataset.id});
    });
  }

  function menuTree(nav) {
    const items = Array.from(nav.children).filter(el => el.tagName === 'LI');
    const parents = [];
    items.forEach(li => {
      const link = one(':scope > a',li); if (!link) return;
      const text = link.textContent.trim(), depth = Math.min(text.match(/^_+/)?.[0].length || 0,2);
      link.textContent = text.replace(/^_+/,'');
      const parent = parents[depth-1];
      if (depth && parent) {
        let sub = one(':scope > ul.sub',parent);
        if (!sub) { sub = document.createElement('ul'); sub.className = 'ul sub sm-' + depth; parent.append(sub); }
        sub.append(li); parent.classList.add('has-sub');
      }
      parents[depth] = li; parents.length = depth+1;
    });
    nav.closest('.widget')?.classList.add('is-ready');
  }
  function initMenus() {
    all('.main-nav').forEach(menuTree);
    all('.main-nav .has-mega > a[data-shortcode]').forEach(link => {
      const li = link.parentElement;
      const labels = (setting(link.dataset.shortcode,'label') || 'recent').split('/').filter(Boolean);
      link.href = searchURL(labels.length === 1 ? labels[0] : 'recent');
      li.classList.add('type-mega');
      const container = one('.mega .container',li);
      if (container) {
        if (labels.length > 1) {
          const nav = document.createElement('div'); nav.className = 'tbb-mega-labels';
          labels.forEach(label => { const a = document.createElement('a'); a.href = searchURL(label); a.textContent = label; nav.append(a); });
          container.append(nav);
        }
        const target = document.createElement('div'); container.append(target);
        const load = () => loadWidget(target,{label:labels[0],type:'mega',count:5});
        li.addEventListener('pointerenter',load,{once:true}); li.addEventListener('focusin',load,{once:true});
      }
      li.dataset.tbbLabels = JSON.stringify(labels);
    });
    const source = one('.main-nav'), dest = one('.mobile-menu');
    if (source && dest && !dest.children.length) {
      const nav = source.cloneNode(true); nav.className = 'mobile-nav';
      all('[id]',nav).forEach(el => el.removeAttribute('id'));
      all('.has-mega',nav).forEach(li => {
        one(':scope > .mega',li)?.remove();
        const sub = document.createElement('ul'); sub.className = 'sub';
        JSON.parse(li.dataset.tbbLabels || '[]').forEach(label => {
          const item = document.createElement('li'), a = document.createElement('a');
          a.href = searchURL(label); a.textContent = label; item.append(a); sub.append(item);
        });
        li.className = 'has-sub'; li.append(sub);
      });
      all('ul.sub',nav).forEach(ul => ul.className = 'sub');
      all('.has-sub > a',nav).forEach(a => {
        a.setAttribute('aria-expanded','false');
        a.addEventListener('click',event => { event.preventDefault(); const on = a.parentElement.classList.toggle('expanded'); a.setAttribute('aria-expanded',String(on)); });
      });
      dest.append(nav);
    }
    const logo = one('.main-logo a'), slot = one('.mobile-logo');
    if (logo && slot && !slot.children.length) {
      const clone = logo.cloneNode(true); all('h1',clone).forEach(el => el.remove());
      all('[id]',clone).forEach(el => el.removeAttribute('id')); slot.append(clone);
    }
    const footer = one('.mm-footer');
    if (footer && !footer.children.length) {
      ['.footer-info .social','.footer-menu ul'].forEach(selector => {
        const original = one(selector); if (!original) return;
        const clone = original.cloneNode(true); clone.className = selector.includes('social') ? 'social color' : 'links';
        all('[id]',clone).forEach(el => el.removeAttribute('id')); all('.text',clone).forEach(el => el.remove()); footer.append(clone);
      });
    }
  }
  function panel(name, trigger) {
    const opening = !!name && activePanel !== name;
    body.classList.remove('menu-on','search-on','share-on');
    all('.menu-toggle').forEach(el => el.setAttribute('aria-expanded','false'));
    if (!opening) { activePanel = null; returnFocus?.focus(); return; }
    activePanel = name; returnFocus = trigger || document.activeElement;
    body.classList.add(name + '-on');
    if (name === 'menu') all('.menu-toggle').forEach(el => el.setAttribute('aria-expanded','true'));
    requestAnimationFrame(() => one(name === 'search' ? '.main-search input' : name === 'menu' ? '.hide-mobile-menu' : '.share-modal button')?.focus());
  }
  function initPanels() {
    all('.menu-toggle').forEach(el => el.addEventListener('click',() => panel('menu',el)));
    all('.search-toggle').forEach(el => el.addEventListener('click',() => panel('search',el)));
    all('.share-toggle,.post-share .show-more button').forEach(el => el.addEventListener('click',() => panel('share',el)));
    all('.overlay-bg,.hide-mobile-menu,.main-search .close,.hide-modal').forEach(el => el.addEventListener('click',() => panel(null)));
    document.addEventListener('keydown',event => {
      if (event.key === 'Escape' && activePanel) panel(null);
      if (event.key !== 'Tab' || !activePanel) return;
      const box = one(activePanel === 'search' ? '.main-search' : activePanel === 'menu' ? '.slide-menu' : '.share-modal');
      if (!box) return;
      const controls = all('a[href],button,input,[tabindex="0"]',box).filter(el => !el.disabled && el.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
  }
  function initDarkMode() {
    const root = document.documentElement;
    const stored = storage.get('tbb_dark_mode') ?? storage.get('dark_mode');
    if (cfg.isDark === true || stored === 'true') root.classList.add('is-dark');
    const sync = () => {
      const dark = root.classList.contains('is-dark');
      all('.darkmode-toggle').forEach(el => el.setAttribute('aria-pressed',String(dark)));
      all('img[data-dark-src]').forEach(img => { img.dataset.src ||= img.src; img.src = dark ? safeURL(img.dataset.darkSrc) || img.dataset.src : img.dataset.src; });
    };
    sync();
    all('.darkmode-toggle').forEach(el => el.addEventListener('click',() => { root.classList.toggle('is-dark'); storage.set('tbb_dark_mode',String(root.classList.contains('is-dark'))); sync(); }));
  }
  function initScroll() {
    const header = one('.header-inner'), buttons = all('.to-top');
    let previous = scrollY, ticking = false;
    const update = () => {
      const y = scrollY;
      if (header && cfg.stickyMenu !== false) {
        const fixed = y > header.offsetHeight * 2;
        header.classList.toggle('is-fixed',fixed); header.classList.toggle('show',fixed && y < previous);
      }
      buttons.forEach(el => el.classList.toggle('show',y >= 100));
      previous = y; ticking = false;
    };
    addEventListener('scroll',() => { if (!ticking) { ticking = true; requestAnimationFrame(update); } },{passive:true});
    buttons.forEach(el => el.addEventListener('click',() => scrollTo({top:0,behavior:reducedMotion() ? 'auto' : 'smooth'})));
  }
  function initSearch() {
    const box = one('.main-search'), input = box && one('input',box), results = box && one('.search-results',box), content = box && one('.search-content',box);
    if (!input || !results || !content) return;
    results.setAttribute('aria-live','polite');
    let timer, controller, version = 0;
    const more = document.createElement('div'); more.className = 'view-all'; content.append(more);
    input.addEventListener('keydown',event => { if (event.key === 'Enter' && input.value.trim()) { event.preventDefault(); location.href = searchURL('',input.value.trim()); } });
    input.addEventListener('input',() => {
      clearTimeout(timer); controller?.abort(); const current = ++version, query = input.value.trim();
      box.classList.remove('loading'); results.replaceChildren(); more.replaceChildren();
      content.classList.toggle('visible',!!query);
      if (!query) return;
      more.innerHTML = `<a class="btn" href="${esc(searchURL('',query))}">${esc(cfg.viewAll || 'Lihat semua')}</a>`;
      timer = setTimeout(async () => {
        controller = new AbortController(); box.classList.add('loading');
        try {
          const posts = await requestFeed('recent',8,query,controller.signal);
          if (current !== version) return;
          results.innerHTML = render(posts,'search'); results.classList.add('scroll'); images(results, true);
        } catch (error) { if (current === version && error.name !== 'AbortError') results.textContent = 'Carian belum dapat dimuatkan. Gunakan pautan Lihat semua.'; }
        finally { if (current === version) box.classList.remove('loading'); }
      },300);
    });
  }
  function initLoadMore() {
    const button = one('#load-more'), target = one('.blog-posts');
    if (!button || !target) return;
    button.addEventListener('click',async event => {
      event.preventDefault(); if (button.dataset.busy) return;
      const url = safeURL(button.dataset.url || button.href,origin); if (!url || new URL(url).origin !== origin) return;
      button.dataset.busy = '1'; button.setAttribute('aria-busy','true');
      try {
        const response = await fetch(url,{credentials:'omit'}); if (!response.ok) throw new Error('Pagination HTTP ' + response.status);
        const doc = new DOMParser().parseFromString(await response.text(),'text/html');
        const incoming = one('.blog-posts',doc), next = one('#load-more',doc);
        if (!incoming) throw new Error('Missing posts');
        const existing = new Set(all(':scope > .post .entry-title a',target).map(a => a.href));
        all(':scope > .post:not(.ad-type)',incoming).forEach(post => {
          const link = one('.entry-title a',post)?.href; if (link && existing.has(link)) return;
          all('script',post).forEach(el => el.remove()); target.append(document.importNode(post,true));
        });
        images(target, true);
        const nextURL = safeURL(next?.dataset.url || next?.getAttribute('href'),url);
        if (nextURL && nextURL !== url && new URL(nextURL).origin === origin) { button.dataset.url = nextURL; button.href = nextURL; }
        else { button.remove(); one('.blog-pager .no-more')?.classList.add('visible'); }
      } catch { location.href = url; }
      finally { delete button.dataset.busy; button.removeAttribute('aria-busy'); }
    });
  }
  function initCopy() {
    all('.copy-link').forEach(box => {
      const input = one('input',box), button = one('button',box); if (!input || !button) return;
      button.addEventListener('click',async () => {
        let copied = false;
        try { await navigator.clipboard.writeText(input.value); copied = true; }
        catch { input.focus(); input.select(); try { copied = document.execCommand('copy'); } catch {} }
        if (copied) { box.classList.add('copied'); setTimeout(() => box.classList.remove('copied'),2500); }
      });
    });
  }
  function initContent() {
    all('.post-body img').forEach(img => { img.decoding = 'async'; if (!img.hasAttribute('loading') && img.getBoundingClientRect().top >= innerHeight) img.loading = 'lazy'; });
    all('.post-body table').forEach(table => {
      if (table.parentElement?.classList.contains('table-responsive-wrapper')) return;
      const wrap = document.createElement('div'); wrap.className = 'table-responsive-wrapper'; table.before(wrap); wrap.append(table);
    });
    all('.video-youtube[data-src]').forEach(box => {
      const url = safeURL(box.dataset.src); if (!url) return;
      const host = new URL(url).hostname;
      if (!/(^|\.)(youtube\.com|youtube-nocookie\.com)$/.test(host)) return;
      const frame = document.createElement('iframe'); frame.src = url; frame.title = 'YouTube video'; frame.loading = 'lazy';
      frame.width = '560'; frame.height = '315'; frame.className = 'tbb-video-frame'; frame.allowFullscreen = true;
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'; box.replaceWith(frame);
    });
    all('.post-body').forEach(post => {
      const marker = all('p,div,span',post).find(el => el.childElementCount === 0 && el.textContent.includes('{getToc}'));
      if (!marker) return;
      const headings = all('h2,h3,h4',post); if (!headings.length) { marker.remove(); return; }
      const details = document.createElement('details'); details.className = 'tbb-toc'; details.open = setting(marker.textContent,'expanded') === 'true';
      const summary = document.createElement('summary'); summary.textContent = setting(marker.textContent,'title') || 'Isi kandungan';
      const list = document.createElement('ol');
      headings.forEach((heading,i) => {
        if (!heading.id) { let id = 'tbb-heading-' + (i+1); while (document.getElementById(id)) id += '-'; heading.id = id; }
        const li = document.createElement('li'), a = document.createElement('a'); a.href = '#' + encodeURIComponent(heading.id); a.textContent = heading.textContent; li.append(a); list.append(li);
      });
      details.append(summary,list); marker.replaceWith(details);
    });
    all('.blog-post-comments').forEach(wrap => {
      const type = setting(wrap.dataset.shortcode,'type') || 'blogger';
      if (type !== 'blogger') return;
      wrap.classList.add('blogger-comments','visible');
      one('#top-continue .comment-reply',wrap)?.classList.add('btn');
      all('.show-cf',wrap).forEach(button => button.addEventListener('click',() => { wrap.classList.add('cf-on'); button.remove(); }));
    });
    all('a.window-open').forEach(link => {
      if (!safeURL(link.getAttribute('href'))) return;
      link.target = '_blank'; link.relList.add('noopener','noreferrer');
    });
    const cookie = one('.cookie-consent');
    let accepted = false;
    try { accepted = document.cookie.split(';').some(s => s.trim() === 'cookie_consent=true'); } catch {}
    if (cookie && one('.widget',cookie) && !accepted) {
      cookie.style.display = 'block'; cookie.classList.add('visible');
      one('.consent-button',cookie)?.addEventListener('click',() => {
        try { document.cookie = 'cookie_consent=true; Max-Age=604800; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : ''); } catch {}
        cookie.classList.remove('visible'); cookie.style.display = 'none';
      });
    }
  }
  function start() {
    body = document.body;
    if (!body || body.dataset.tbbRuntime) return;
    body.dataset.tbbRuntime = '2.2.1';
    [initMenus,initPanels,initDarkMode,initScroll,images,initFeeds,initSearch,initLoadMore,initCopy,initContent].forEach(init => {
      try { init(); } catch (error) { console.error('TBB ' + init.name, error); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
