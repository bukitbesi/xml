/* thebukitbesi.com — vanilla JS behavior layer, split from Blogger theme for CDN caching.
   Host in a public GitHub repo and serve via jsDelivr:
   https://cdn.jsdelivr.net/gh/<github-user>/<repo>@main/tbb-script.js
   No jQuery dependency. Loaded with `defer` near the end of <body>. */
(function(){
'use strict';
var d=document,w=window,root=d.documentElement,body=d.body;
var q=function(s,c){return (c||d).querySelector(s)},qa=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var on=function(el,ev,fn,opt){if(el)el.addEventListener(ev,fn,opt||false)};
var esc=function(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
function text(v){var x=d.createElement('div');x.innerHTML=v||'';return (x.textContent||'').trim()}
function attr(sc,k,def){var m=String(sc||'').match(new RegExp('\\$'+k+'=\\{([^}]*)\\}','i'));return m&&m[1]?m[1]:def}
function postLink(e){var l=(e.link||[]).filter(function(x){return x.rel==='alternate'})[0];return l?l.href:'#'}
function postImg(e){
 var u=e.media$thumbnail&&e.media$thumbnail.url?e.media$thumbnail.url:'';
 if(!u&&e.content&&e.content.$t){var m=e.content.$t.match(/<img[^>]+src=["']([^"']+)/i);u=m?m[1]:''}
 return u?u.replace(/\/s72-c\//,'/s640/').replace(/=s72-c/,'=s640'):''}
function postSummary(e){return text((e.summary&&e.summary.$t)||(e.content&&e.content.$t)||'').slice(0,170)}
function dateText(e){try{return new Date(e.published.$t).toLocaleDateString(d.documentElement.lang||'ms-MY',{year:'numeric',month:'short',day:'numeric'})}catch(x){return ''}}
function card(e,large){
 var title=esc(e.title&&e.title.$t),url=esc(postLink(e)),img=esc(postImg(e)),summary=esc(postSummary(e)),dt=esc(dateText(e));
 var lab=e.category&&e.category.length?esc(e.category[0].term):'';
 return '<article class="post'+(large?' first':'')+'">'+
 '<div class="entry-thumbnail"><a class="thumbnail pbt-lazy" href="'+url+'" aria-label="'+title+'"'+(img?' style="background-image:url('+img+')"':'')+'></a></div>'+
 '<header class="entry-header">'+(lab?'<a class="entry-tag" href="/search/label/'+encodeURIComponent(lab)+'">'+lab+'</a>':'')+
 '<h2 class="entry-title title"><a href="'+url+'">'+title+'</a></h2>'+
 (summary&&!large?'<p class="entry-excerpt excerpt">'+summary+'</p>':'')+
 (dt?'<div class="entry-meta"><span class="entry-time">'+dt+'</span></div>':'')+
 '</header></article>'
}
function renderWidget(el,entries,type){
 var insideFeatured=!!el.closest('.featured'),cls='grid-items';
 if(type==='list')cls='list-items'; else if(type==='story')cls='story-items'; else if(type==='video')cls='video-items'; else if(type==='block1')cls='block1-items'; else if(type==='block2')cls='block2-items';
 if(insideFeatured){
   var first=entries[0]?card(entries[0],true):'',rest=entries.slice(1,4).map(function(e){return card(e,false)}).join('');
   el.innerHTML='<div class="featured-items"><div class="first">'+first+'</div><div class="grid">'+rest+'</div></div>';
 } else el.innerHTML='<div class="'+cls+'">'+entries.map(function(e,i){return card(e,type==='block1'&&i===0)}).join('')+'</div>';
}
var jsonpN=0;
function feed(label,n,cb){
 var name='__tbbFeed'+(++jsonpN),s=d.createElement('script'),base=location.origin+'/feeds/posts/default/';
 w[name]=function(data){try{cb((data&&data.feed&&data.feed.entry)||[])}finally{delete w[name];s.remove()}};
 s.onerror=function(){delete w[name];s.remove();cb([])};
 s.src=base+(label?'-/'+encodeURIComponent(label)+'/':'')+'?alt=json-in-script&max-results='+n+'&callback='+name;
 d.head.appendChild(s);
}
function initFeeds(){
 qa('.widget-content[data-shortcode]').forEach(function(el){
  var sc=el.getAttribute('data-shortcode')||'',type=attr(sc,'type','grid'),labels=attr(sc,'label','').split('/').filter(Boolean),label=labels[0]||'',n=parseInt(attr(sc,'results',el.closest('.featured')?'4':'6'),10)||6;
  el.setAttribute('aria-busy','true');
  feed(label,n,function(entries){renderWidget(el,entries,type);el.removeAttribute('aria-busy')});
 });
}
function initLazy(){
 qa('[data-src]').forEach(function(el){
  var apply=function(){var u=el.getAttribute('data-src');if(!u)return;if(el.tagName==='IMG')el.src=u;else el.style.backgroundImage='url("'+u.replace(/"/g,'%22')+'")';el.classList.add('pbt-lazy');el.removeAttribute('data-src')};
  if('IntersectionObserver'in w){var io=new IntersectionObserver(function(es,o){es.forEach(function(e){if(e.isIntersecting){apply();o.unobserve(e.target)}})},{rootMargin:'300px 0px'});io.observe(el)}else apply();
 });
}
function initMenu(){
 qa('#main-menu .widget').forEach(function(wg){wg.classList.add('is-ready')});
 var main=q('.main-nav'); if(main){
   var links=qa('a',main),parents={1:null,2:null};
   links.forEach(function(a,i){var t=(a.textContent||'').trim();if(t.charAt(0)==='_'){var level=t.indexOf('__')===0?2:1;a.textContent=t.replace(/^_+/,'');var prev=links[i-1];if(prev){var li=prev.closest('li');if(li){var ul=q('.sm-'+level,li);if(!ul){ul=d.createElement('ul');ul.className='ul sub sm-'+level;li.appendChild(ul);li.classList.add('has-sub')}ul.appendChild(a.closest('li'))}}}});
   var mob=q('.mobile-menu');if(mob&&!q('.mobile-nav',mob)){var clone=main.cloneNode(true);clone.className='mobile-nav';clone.removeAttribute('id');mob.appendChild(clone)}
 }
 qa('.mobile-menu .has-sub > a').forEach(function(a){on(a,'click',function(e){var li=a.parentElement,sub=q('.sub',li);if(sub){e.preventDefault();li.classList.toggle('expanded');sub.style.display=li.classList.contains('expanded')?'block':'none'}})});
 var mlog=q('.mobile-logo');if(mlog&&!mlog.firstElementChild){var lg=q('.main-logo a');if(lg){var lgClone=lg.cloneNode(true);var h1=q('h1',lgClone);if(h1)h1.remove();mlog.appendChild(lgClone)}}
}
function darkLogo(isDark){
 qa('[data-dark-src]').forEach(function(im){var src=im.getAttribute(isDark?'data-dark-src':'data-src');if(src)im.src=src});
}
function initUI(){
 var slide=q('.slide-menu'),overlay=q('.overlay-bg'),search=q('.main-search');
 qa('.menu-toggle,.hide-mobile-menu').forEach(function(b){on(b,'click',function(){body.classList.toggle('menu-on');body.classList.toggle('show-overlay',body.classList.contains('menu-on'))})});
 qa('.search-toggle').forEach(function(b){on(b,'click',function(){body.classList.add('search-on','show-overlay');var i=q('.main-search .input');if(i)setTimeout(function(){i.focus()},40)})});
 function close(){body.classList.remove('menu-on','search-on','show-overlay')}
 on(overlay,'click',close);qa('.main-search .close').forEach(function(b){on(b,'click',close)});
 on(d,'keydown',function(e){if(e.key==='Escape')close()});
 var sf=q('.main-search .form');if(sf){on(sf,'submit',function(e){var i=q('.input',sf);if(i&&i.value.trim()){e.preventDefault();location.href='/search?q='+encodeURIComponent(i.value.trim())}})}
 var dark=q('.darkmode-toggle');if(dark){var saved='';try{saved=localStorage.getItem('tbb-theme')||''}catch(e){}if(saved==='dark'||root.classList.contains('is-dark')){root.classList.add('is-dark');darkLogo(true)}on(dark,'click',function(){var isDark=root.classList.toggle('is-dark');darkLogo(isDark);try{localStorage.setItem('tbb-theme',isDark?'dark':'light')}catch(e){}})}
 var top=q('.to-top');if(top){on(w,'scroll',function(){top.classList.toggle('show',w.scrollY>500)},{passive:true});on(top,'click',function(){w.scrollTo({top:0,behavior:'smooth'})})}
}
function initPost(){
 qa('.post-body table').forEach(function(t){if(!t.parentElement.classList.contains('table-responsive-wrapper')){var x=d.createElement('div');x.className='table-responsive-wrapper';t.parentNode.insertBefore(x,t);x.appendChild(t)}});
 var pt=(d.title.split('|')[0]||'').trim();qa('.post-body img').forEach(function(im){if(!im.alt)im.alt=pt;im.loading=im.loading||'lazy';im.decoding='async'});
 qa('iframe[src*="youtube.com"],iframe[src*="youtu.be"]').forEach(function(f){f.loading='lazy';if(!f.title)f.title='Video'});
}
function initAds(){
 qa('ins.adsbygoogle').forEach(function(ad){var p=ad.parentElement;if(p)p.style.contain='layout style';try{(w.adsbygoogle=w.adsbygoogle||[]).push({})}catch(e){}});
}
function start(){initMenu();initUI();initLazy();initFeeds();initPost();initAds()}
if(d.readyState==='loading')on(d,'DOMContentLoaded',start);else start();
})();
