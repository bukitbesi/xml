/* The Bukit Besi feed hotfix 2.2.2 — JSONP fallback for Blogger Preview/CORS failures. */
(() => {
  'use strict';

  const one = (s, root = document) => root.querySelector(s);
  const all = (s, root = document) => Array.from(root.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const setting = (text, key) => String(text || '').match(new RegExp('\\$' + key + '=\\{([^}]*)\\}', 'i'))?.[1].trim() || '';
  const safeURL = (value, base = location.href) => {
    if (!value) return '';
    try {
      const u = new URL(value, base);
      return /^https?:$/.test(u.protocol) ? u.href : '';
    } catch {
      return '';
    }
  };

  const cfg = typeof pbt === 'object' && pbt ? pbt : {};
  const runtime = one('#tbb-runtime-v221');
  const blogURL = safeURL(runtime?.dataset.blogUrl || one('link[rel="canonical"]')?.href) || location.href;
  const origin = new URL(blogURL).origin;
  const fallbackImage = safeURL(typeof noThumbnail === 'string' ? noThumbnail : cfg.noThumb, origin);
  const inflight = new Map();
  let callbackId = 0;

  function searchURL(label = '', query = '') {
    const u = new URL(label && !['recent', 'random'].includes(label) ? '/search/label/' + encodeURIComponent(label) : '/search', origin);
    if (query) u.searchParams.set('q', query);
    return u.href;
  }

  function mapEntry(entry) {
    const doc = new DOMParser().parseFromString(entry.summary?.$t || entry.content?.$t || '', 'text/html');
    all('script,style,noscript', doc).forEach(el => el.remove());
    const url = safeURL(entry.link?.find(l => l.rel === 'alternate')?.href, origin);
    const image = one('img', doc)?.getAttribute('src') || '';
    const thumb = safeURL(entry.media$thumbnail?.url || image, url || origin) || fallbackImage;
    const rawDate = entry.published?.$t || '';
    const date = new Date(rawDate);
    let dateLabel = '';
    if (!Number.isNaN(date.getTime())) {
      try {
        dateLabel = date.toLocaleDateString((document.documentElement.lang || 'ms-MY').replaceAll('_', '-'), {day:'2-digit', month:'long'});
      } catch {
        dateLabel = date.toLocaleDateString('ms-MY', {day:'2-digit', month:'long'});
      }
    }
    return {
      id: (entry.id?.$t || '').split('post-').pop(),
      url,
      thumb,
      title: entry.title?.$t || cfg.noTitle || 'Untitled',
      author: entry.author?.[0]?.name?.$t || '',
      category: entry.category?.[0]?.term || '',
      summary: (doc.body?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240),
      published: Number.isNaN(date.getTime()) ? '' : date.toISOString(),
      date: dateLabel
    };
  }

  function jsonpFeed(label, count, query = '') {
    const u = new URL('/feeds/posts/default' + (label && !['recent', 'random'].includes(label) ? '/-/' + encodeURIComponent(label) : ''), origin);
    u.searchParams.set('alt', 'json-in-script');
    u.searchParams.set('max-results', String(Math.max(1, Math.min(30, count))));
    if (query) u.searchParams.set('q', query);
    const key = u.href;
    if (inflight.has(key)) return inflight.get(key);

    const promise = new Promise((resolve, reject) => {
      const cb = '__tbbFeed_' + Date.now().toString(36) + '_' + (++callbackId);
      const script = document.createElement('script');
      let finished = false;

      const cleanup = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        script.remove();
        try { delete window[cb]; } catch { window[cb] = undefined; }
      };

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Blogger JSONP timeout'));
      }, 12000);

      window[cb] = data => {
        try {
          if (!data?.feed) throw new Error('Invalid Blogger feed');
          const posts = (data.feed.entry || []).map(mapEntry).filter(p => p.url);
          cleanup();
          resolve(posts);
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      u.searchParams.set('callback', cb);
      script.async = true;
      script.src = u.href;
      script.referrerPolicy = 'strict-origin-when-cross-origin';
      script.onerror = () => {
        cleanup();
        reject(new Error('Blogger JSONP failed'));
      };
      document.head.append(script);
    }).finally(() => inflight.delete(key));

    inflight.set(key, promise);
    return promise;
  }

  function thumbnail(p) {
    return `<div class="thumbnail" data-src="${esc(p.thumb)}" style="${p.thumb ? `background-image:url('${esc(p.thumb).replace(/'/g, '&#39;')}');opacity:1` : ''}"></div>`;
  }

  function card(p, {classes = '', overlay = false, full = false} = {}) {
    const category = full && cfg.postCategory !== false && p.category ? `<span class="entry-tag">${esc(p.category)}</span>` : '';
    const author = full && cfg.postAuthor !== false && p.author ? `<span class="entry-author"><span class="author-name">${esc(p.author)}</span></span>` : '';
    const date = cfg.postDate !== false && p.published ? `<span class="entry-time"><time datetime="${esc(p.published)}">${esc(p.date)}</time></span>` : '';
    const meta = author || date ? `<div class="entry-meta">${author}${date}</div>` : '';
    const summary = full && !overlay && cfg.postSummary !== false && p.summary ? `<p class="entry-excerpt excerpt">${esc(p.summary)}</p>` : '';
    const heading = `<div class="entry-header">${category}<h2 class="entry-title">${overlay ? esc(p.title) : `<a href="${esc(p.url)}">${esc(p.title)}</a>`}</h2>${summary}${meta}</div>`;
    return `<article class="post ${classes}${overlay ? ' card cs' : ''}">${overlay ? `<a class="entry-inner" href="${esc(p.url)}"><span class="entry-thumbnail">${thumbnail(p)}</span>${heading}</a>` : `<a class="entry-thumbnail" href="${esc(p.url)}" aria-label="${esc(p.title)}">${thumbnail(p)}</a>${heading}`}</article>`;
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
    const actual = allowed.includes(type) ? type : 'grid';
    return `<div class="${actual}-items">${list(posts,{full:['grid','list'].includes(actual)})}</div>`;
  }

  function optsFor(target) {
    const code = target.dataset.shortcode || '';
    const widget = target.closest('.widget');
    const type = target.closest('.featured') ? 'featured' : target.closest('.sidebar,.footer,.site-footer') ? 'side' : setting(code, 'type') || 'block1';
    const label = setting(code, 'label') || 'recent';
    const defaults = {featured:4, block1:5, block2:5, story:3, video:5, side:4, grid:4, list:4, related:3, mega:5};
    const count = Math.max(1, Math.min(20, parseInt(setting(code, 'results'), 10) || defaults[type] || 4));
    widget?.classList.add('type-' + (Object.prototype.hasOwnProperty.call(defaults, type) ? type : 'grid'));
    const link = widget?.querySelector('.title-link');
    if (link) link.href = searchURL(label);
    return {label, count, type};
  }

  function errorUI(target, opts) {
    target.replaceChildren();
    const wrap = document.createElement('div');
    wrap.className = 'tbb-feed-error';
    wrap.setAttribute('role', 'status');
    wrap.append(document.createTextNode('Artikel belum dapat dimuatkan. '));

    const link = document.createElement('a');
    link.href = searchURL(opts.label);
    link.textContent = 'Lihat artikel';
    wrap.append(link, document.createTextNode(' '));

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.textContent = 'Cuba semula';
    button.addEventListener('click', () => recover(target, opts, true), {once:true});
    wrap.append(button);
    target.append(wrap);
  }

  async function recover(target, opts = optsFor(target), force = false) {
    if (!target?.isConnected) return;
    if (!force && target.dataset.tbbHotfix === 'loading') return;
    if (!force && target.dataset.tbbState === 'loaded' && !target.querySelector('.tbb-feed-error')) return;

    target.dataset.tbbHotfix = 'loading';
    target.setAttribute('aria-busy', 'true');

    try {
      let posts = await jsonpFeed(opts.label, opts.count);
      if (opts.label === 'random') {
        posts = [...posts];
        for (let i = posts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [posts[i], posts[j]] = [posts[j], posts[i]];
        }
      }
      target.innerHTML = render(posts.slice(0, opts.count), opts.type);
      target.dataset.tbbState = 'loaded';
      target.dataset.tbbHotfix = 'loaded';
    } catch (error) {
      target.dataset.tbbState = 'error';
      target.dataset.tbbHotfix = 'error';
      errorUI(target, opts);
      console.warn('TBB feed hotfix:', error);
    } finally {
      target.removeAttribute('aria-busy');
    }
  }

  function recoverRelated() {
    all('.related-wrap').forEach(wrap => {
      const target = one('.widget-content', wrap);
      const tag = one('.related-tag', wrap);
      if (!target || !tag) return;
      if (target.dataset.tbbState === 'loaded' && !target.querySelector('.tbb-feed-error')) return;
      const code = one('#related-posts .HTML')?.dataset.shortcode || '';
      const chosen = setting(code, 'label');
      const label = chosen && chosen !== 'related' ? chosen : tag.dataset.label || 'recent';
      const count = Math.max(1, Math.min(20, parseInt(setting(code, 'results'), 10) || 3));
      jsonpFeed(label, count + 1).then(posts => {
        posts = posts.filter(p => p.id !== String(tag.dataset.id)).slice(0, count);
        target.innerHTML = render(posts, 'related');
        target.dataset.tbbState = 'loaded';
        target.dataset.tbbHotfix = 'loaded';
      }).catch(() => errorUI(target, {label, count, type:'related'}));
    });
  }

  function scan() {
    all('.getPosts .widget-content[data-shortcode]').forEach(target => {
      const failed = target.dataset.tbbState === 'error' || !!target.querySelector('.tbb-feed-error');
      const stalled = !target.dataset.tbbState && !target.children.length;
      if (failed || stalled) recover(target);
    });
    recoverRelated();
  }

  function start() {
    setTimeout(scan, 900);
    setTimeout(scan, 2500);

    const observer = new MutationObserver(records => {
      if (records.some(r => [...r.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('.tbb-feed-error') || n.querySelector?.('.tbb-feed-error'))))) {
        queueMicrotask(scan);
      }
    });
    observer.observe(document.body, {subtree:true, childList:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
