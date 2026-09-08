/* TBB v3 analytics bootstrap — GA4 only, deferred off the critical rendering path. */
(() => {
  'use strict';
  const GA_ID = 'G-0XL6FW2M0R';
  let started = false;

  function start() {
    if (started) return;
    started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      page_title: document.title,
      page_location: location.href,
      page_path: location.pathname,
      transport_type: 'beacon'
    });
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.append(s);
  }

  const onFirstInteraction = () => start();
  ['pointerdown','keydown','touchstart'].forEach(type => addEventListener(type, onFirstInteraction, {once:true, passive:true}));
  if ('requestIdleCallback' in window) requestIdleCallback(start, {timeout:2500});
  else setTimeout(start, 1800);
})();