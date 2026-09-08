/* The Bukit Besi v3 core runtime — navigation, panels, theme, scroll, content safety. Zero jQuery. */
(() => {
  'use strict';

  const one = (s, root = document) => root.querySelector(s);
  const all = (s, root = document) => Array.from(root.querySelectorAll(s));
  const setting = (text, key) => String(text || '').match(new RegExp('\\$' + key + '=\\{([^}]*)\\}', 'i'))?.[1].trim() || '';
  const safeURL = (value, base = location.href) => {
    if (!value) return '';
    try { const u = new URL(value, base); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; }
  };
  const cfg = typeof pbt === 'object' && pbt ? pbt : {};
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let body, activePanel = null, returnFocus = null;

  function searchURL(label = '') {
    const base = one('link[rel="canonical"]')?.href || location.href;
    const origin = new URL(base, location.href).origin;
    return new URL(label && !['recent','random'].includes(label) ? '/search/label/' + encodeURIComponent(label) : '/search', origin).href;
  }

  function menuTree(nav) {
    if (!nav || nav.dataset.tbbTree === '1') return;
    nav.dataset.tbbTree = '1';
    const items = Array.from(nav.children).filter(el => el.tagName === 'LI');
    const parents = [];
    items.forEach(li => {
      const link = one(':scope > a', li);
      if (!link) return;
      const text = link.textContent.trim();
      const depth = Math.min(text.match(/^_+/)?.[0].length || 0, 2);
      link.textContent = text.replace(/^_+/, '');
      const parent = parents[depth - 1];
      if (depth && parent) {
        let sub = one(':scope > ul.sub', parent);
        if (!sub) {
          sub = document.createElement('ul');
          sub.className = 'ul sub sm-' + depth;
          parent.append(sub);
        }
        sub.append(li);
        parent.classList.add('has-sub');
      }
      parents[depth] = li;
      parents.length = depth + 1;
    });
    nav.closest('.widget')?.classList.add('is-ready');
  }

  function mobileFromDesktop(source, dest) {
    if (!source || !dest || dest.children.length) return;
    const nav = source.cloneNode(true);
    nav.className = 'mobile-nav';
    all('[id]', nav).forEach(el => el.removeAttribute('id'));

    all('.has-mega', nav).forEach(li => {
      const a = one(':scope > a', li);
      const labels = (setting(a?.dataset.shortcode || '', 'label') || '').split('/').map(s => s.trim()).filter(Boolean);
      one(':scope > .mega', li)?.remove();
      if (labels.length) {
        let sub = one(':scope > ul.sub', li);
        if (!sub) { sub = document.createElement('ul'); sub.className = 'sub'; li.append(sub); }
        labels.forEach(label => {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = searchURL(label);
          link.textContent = label;
          item.append(link);
          sub.append(item);
        });
      }
      li.classList.remove('has-mega', 'type-mega');
      li.classList.add('has-sub');
    });

    all('ul.sub', nav).forEach(ul => ul.className = 'sub');
    all('.has-sub > a', nav).forEach(a => {
      a.setAttribute('aria-expanded', 'false');
      a.addEventListener('click', event => {
        const li = a.parentElement;
        if (!one(':scope > ul.sub', li)) return;
        event.preventDefault();
        const on = li.classList.toggle('expanded');
        a.setAttribute('aria-expanded', String(on));
      });
    });
    dest.append(nav);
  }

  function hydrateDrawerFooter() {
    const footer = one('.mm-footer');
    if (!footer || footer.children.length) return;
    const social = one('.footer-info .social');
    if (social) {
      const clone = social.cloneNode(true);
      clone.className = 'social color';
      all('[id]', clone).forEach(el => el.removeAttribute('id'));
      all('.text', clone).forEach(el => el.remove());
      footer.append(clone);
    }
    const links = one('.footer-menu ul');
    if (links) {
      const clone = links.cloneNode(true);
      clone.className = 'links';
      all('[id]', clone).forEach(el => el.removeAttribute('id'));
      footer.append(clone);
    }
  }

  function initMenus() {
    const source = one('#main-menu .main-nav') || one('.main-nav');
    if (source) menuTree(source);
    one('#main-menu .widget')?.classList.add('is-ready');

    const dest = one('.mobile-menu');
    mobileFromDesktop(source, dest);

    const logo = one('.main-logo a');
    const slot = one('.mobile-logo');
    if (logo && slot && !slot.children.length) {
      const clone = logo.cloneNode(true);
      all('[id]', clone).forEach(el => el.removeAttribute('id'));
      slot.append(clone);
    }
    hydrateDrawerFooter();
  }

  function focusables(box) {
    return all('a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]', box)
      .filter(el => el.getClientRects().length);
  }

  function panel(name, trigger) {
    const opening = !!name && activePanel !== name;
    body.classList.remove('menu-on', 'search-on', 'share-on');
    all('.menu-toggle').forEach(el => el.setAttribute('aria-expanded', 'false'));
    if (!opening) {
      const oldFocus = returnFocus;
      activePanel = null;
      returnFocus = null;
      oldFocus?.focus?.();
      return;
    }
    activePanel = name;
    returnFocus = trigger || document.activeElement;
    body.classList.add(name + '-on');
    if (name === 'menu') all('.menu-toggle').forEach(el => el.setAttribute('aria-expanded', 'true'));
    requestAnimationFrame(() => {
      const box = one(name === 'menu' ? '.slide-menu' : name === 'search' ? '.main-search' : '.share-modal');
      focusables(box || document)[0]?.focus();
    });
  }

  function initPanels() {
    all('.menu-toggle').forEach(el => el.addEventListener('click', () => panel('menu', el)));
    all('.search-toggle').forEach(el => el.addEventListener('click', () => panel('search', el)));
    all('.share-toggle,.post-share .show-more button').forEach(el => el.addEventListener('click', () => panel('share', el)));
    all('.overlay-bg,.hide-mobile-menu,.main-search .close,.hide-modal').forEach(el => el.addEventListener('click', () => panel(null)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && activePanel) return panel(null);
      if (event.key !== 'Tab' || !activePanel) return;
      const box = one(activePanel === 'menu' ? '.slide-menu' : activePanel === 'search' ? '.main-search' : '.share-modal');
      if (!box) return;
      const controls = focusables(box);
      if (!controls.length) return;
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  function initDarkMode() {
    const root = document.documentElement;
    const stored = storage.get('tbb_dark_mode') ?? storage.get('dark_mode');
    if (cfg.isDark === true || stored === 'true') root.classList.add('is-dark');
    const sync = () => {
      const dark = root.classList.contains('is-dark');
      all('.darkmode-toggle').forEach(el => el.setAttribute('aria-pressed', String(dark)));
    };
    sync();
    all('.darkmode-toggle').forEach(el => el.addEventListener('click', () => {
      root.classList.toggle('is-dark');
      storage.set('tbb_dark_mode', String(root.classList.contains('is-dark')));
      sync();
    }));
  }

  function initScroll() {
    const header = one('.header-inner');
    const buttons = all('.to-top');
    let previous = scrollY, ticking = false;
    const update = () => {
      const y = scrollY;
      if (header && cfg.stickyMenu !== false) {
        const fixed = y > header.offsetHeight * 2;
        header.classList.toggle('is-fixed', fixed);
        header.classList.toggle('show', fixed && y < previous);
      }
      buttons.forEach(el => el.classList.toggle('show', y >= 100));
      previous = y;
      ticking = false;
    };
    addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, {passive:true});
    buttons.forEach(el => el.addEventListener('click', () => scrollTo({top:0, behavior:reducedMotion() ? 'auto' : 'smooth'})));
  }

  function initContent() {
    all('.post-body img').forEach(img => {
      img.decoding = 'async';
      if (!img.hasAttribute('loading') && img.getBoundingClientRect().top >= innerHeight) img.loading = 'lazy';
    });
    all('.post-body table').forEach(table => {
      if (table.parentElement?.classList.contains('table-responsive-wrapper')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-responsive-wrapper';
      table.before(wrap); wrap.append(table);
    });
    all('a.window-open').forEach(link => {
      if (!safeURL(link.getAttribute('href'))) return;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  }

  function start() {
    body = document.body;
    if (!body || body.dataset.tbbCore === '3.0.0') return;
    body.dataset.tbbCore = '3.0.0';
    [initMenus, initPanels, initDarkMode, initScroll, initContent].forEach(init => {
      try { init(); } catch (error) { console.error('TBB core ' + init.name, error); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();