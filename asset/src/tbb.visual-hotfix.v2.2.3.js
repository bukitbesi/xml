/* TBB visual hotfix 2.2.3 — sharp feed thumbnails + compact story cards. Zero jQuery. */
(() => {
  'use strict';

  const THUMB_W = 720;
  const THUMB_H = 405;

  function sharpThumb(value) {
    if (!value) return '';
    try {
      const u = new URL(value, location.href);
      if (!/^https?:$/.test(u.protocol)) return '';

      const host = u.hostname.toLowerCase();
      const googleImage = /(^|\.)(googleusercontent\.com|blogspot\.com|ggpht\.com)$/.test(host);
      if (!googleImage) return u.href;

      const size = `w${THUMB_W}-h${THUMB_H}-p-k-no-nu-rw`;

      /* Legacy Blogger image URLs: /s72-c/, /s320/, /w400-h225-p-k-no-nu/ */
      u.pathname = u.pathname.replace(
        /\/(?:s\d+(?:-[a-z0-9-]+)?|w\d+(?:-h\d+)?(?:-[a-z0-9-]+)?)\//i,
        '/' + size + '/'
      );

      /* New Blogger/Google proxy image URLs ending with =s72-c etc. */
      if (/\/img\/a\/|\/blogger_img_proxy\//.test(u.pathname) || /=s\d+/i.test(u.href) || /=w\d+/i.test(u.href)) {
        const href = u.href.replace(/=(?:s\d+|w\d+(?:-h\d+)?)(?:-[a-z0-9-]+)?(?:$|(?=[?#]))/i, '=' + size);
        return href;
      }

      return u.href;
    } catch {
      return '';
    }
  }

  function patchThumb(el) {
    if (!(el instanceof HTMLElement)) return;
    const raw = el.dataset.src || '';
    const sharp = sharpThumb(raw);
    if (!sharp || sharp === el.dataset.tbbSharpSrc) return;

    el.dataset.tbbSharpSrc = sharp;
    el.dataset.src = sharp;

    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      el.style.backgroundImage = `url("${sharp.replace(/"/g, '%22')}")`;
      el.style.opacity = '1';
      el.classList.add('pbt-lazy');
    };
    img.onerror = () => {
      /* Keep the previous runtime image if the sharpened candidate cannot load. */
    };
    img.src = sharp;
  }

  function patch(root = document) {
    root.querySelectorAll?.('.getPosts .thumbnail[data-src], .related-wrap .thumbnail[data-src], .featured .thumbnail[data-src]')
      .forEach(patchThumb);
  }

  function addCSS() {
    if (document.getElementById('tbb-visual-hotfix-v223-css')) return;
    const style = document.createElement('style');
    style.id = 'tbb-visual-hotfix-v223-css';
    style.textContent = `
      .content-section .widget.type-story{overflow:hidden}
      .content-section .type-story>.widget-content{overflow-x:auto;overscroll-behavior-inline:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
      .content-section .story-items{align-items:stretch}
      .content-section .story-items .post{aspect-ratio:4/5;min-height:0}
      .content-section .story-items .card .entry-header{padding:1rem;gap:.5rem}
      .content-section .story-items .entry-title{font-size:1rem;line-height:1.3;-webkit-line-clamp:3}
      @media(max-width:680px){
        .content-section .story-items{grid-template-columns:repeat(3,minmax(9.75rem,9.75rem));gap:.75rem;width:max-content;max-width:none;padding:0}
        .content-section .story-items .post{aspect-ratio:4/5}
        .content-section .story-items .card .entry-header{padding:.875rem}
        .content-section .story-items .entry-title{font-size:.95rem;line-height:1.28;-webkit-line-clamp:3}
      }
      @media(max-width:390px){
        .content-section .story-items{grid-template-columns:repeat(3,minmax(9rem,9rem))}
      }
    `;
    document.head.append(style);
  }

  function start() {
    addCSS();
    patch();

    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.('.thumbnail[data-src]')) patchThumb(node);
          patch(node);
        }
      }
    });
    observer.observe(document.body, {subtree:true, childList:true});

    /* Feed hotfix may render shortly after DOM ready. */
    setTimeout(patch, 900);
    setTimeout(patch, 2600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
