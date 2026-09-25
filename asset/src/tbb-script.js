/* thebukitbesi.com — vanilla JS behavior layer, split from Blogger theme for CDN caching.
   Host in a public GitHub repo and serve via jsDelivr:
   https://cdn.jsdelivr.net/gh/<github-user>/<repo>@main/tbb-script.js
   No jQuery dependency. Loaded with `defer` near the end of <body>.
   Full port of the original jQuery shortcode/widget framework (TOC, cards, alerts,
   download/continue buttons, pagination, mega menu, related posts, etc). */
(function(){
'use strict';
var d=document,w=window,root=d.documentElement,body=d.body;
var q=function(s,c){return (c||d).querySelector(s)},qa=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var on=function(el,ev,fn,opt){if(el)el.addEventListener(ev,fn,opt||false)};
var esc=function(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
function text(v){var x=d.createElement('div');x.innerHTML=v||'';return (x.textContent||'').trim()}
/* getAttr equivalent: reads $key={value} tokens out of shortcode text, e.g. {getPosts}$type={story}$results={6} */
function attr(sc,k,def){var m=String(sc||'').match(new RegExp('\\$'+k+'=\\{([^}]*)\\}','i'));return m&&m[1]!==undefined&&m[1]!==''?m[1]:def}
var pbtSafe=(typeof pbt!=='undefined')?pbt:{};
var optSafe=(typeof options!=='undefined')?options:{};

/* ---------------------------------------------------------------------
   Lazy-loading (IntersectionObserver) — shared by feed thumbnails & <img data-src>
--------------------------------------------------------------------- */
var lazyIO=('IntersectionObserver' in w)?new IntersectionObserver(function(entries,obs){
 entries.forEach(function(en){if(en.isIntersecting){applyLazy(en.target);obs.unobserve(en.target)}});
},{rootMargin:'300px 0px'}):null;
/* Blogger's own image CDN serves whatever size is baked into the URL's w{n}-h{n} segment.
   The template always emits a 72x72 placeholder (see postThumbnail/avatar includables), so
   without resizing here every hero/thumbnail image would render as a blurry 72px image
   stretched to fill its box. Ports the original pbtLazy plugin's resize-to-rendered-size step. */
function resizeSrc(u,box){
 if(!box||!box.width)return u;
 var w=Math.max(1,Math.round(box.width*1.1)),h=Math.max(1,Math.round(box.height*1.1));
 var size='w'+w+'-h'+h+'-p-k-no-nu-rw';
 if(/=?w72-h72-p-k-no-nu/.test(u))return u.replace(/=w72-h72-p-k-no-nu/,'='+size).replace(/\/w72-h72-p-k-no-nu/,'/'+size);
 return u;
}
function applyLazy(el){
 var u=el.getAttribute('data-src');if(!u)return;
 var box=el.getBoundingClientRect();
 u=resizeSrc(u,box);
 if(el.tagName==='IMG')el.src=u;else el.style.backgroundImage='url("'+u.replace(/"/g,'%22')+'")';
 el.classList.add('pbt-lazy');el.removeAttribute('data-src');
}
function observeLazy(root){
 qa('[data-src]',root||d).forEach(function(el){if(lazyIO)lazyIO.observe(el);else applyLazy(el)});
}

/* ---------------------------------------------------------------------
   Feed fetch (Blogger JSONP) — uses pbt.homeUrl instead of location.origin
   (inside Blogger's draft-preview iframe, location.origin is draft.blogger.com,
   which has no /feeds/posts/ for this blog and silently 404s every widget)
--------------------------------------------------------------------- */
function feedBase(){
 try{if(typeof pbt!=='undefined'&&pbt.homeUrl)return pbt.homeUrl.replace(/\/$/,'')+'/feeds/posts/default/'}catch(e){}
 return location.origin+'/feeds/posts/default/';
}
var jsonpN=0;
function feed(label,n,cb,query){
 var name='__tbbFeed'+(++jsonpN),s=d.createElement('script'),done=false;
 function finish(entries){if(done)return;done=true;clearTimeout(timer);try{delete w[name]}catch(e){}if(s.parentNode)s.parentNode.removeChild(s);cb(entries||[])}
 var timer=setTimeout(function(){finish([])},9000);
 w[name]=function(data){finish((data&&data.feed&&data.feed.entry)||[])};
 s.onerror=function(){finish([])};
 s.src=feedBase()+(label?'-/'+encodeURIComponent(label)+'/':'')+'?alt=json-in-script&max-results='+n+(query?'&q='+encodeURIComponent(query):'')+'&callback='+name;
 d.head.appendChild(s);
}

/* ---------------------------------------------------------------------
   Post model + item templates (ports getPostContent/getPostImage/getPostTitle/…)
--------------------------------------------------------------------- */
function postFromEntry(e){
 var link=((e.link||[]).filter(function(x){return x.rel==='alternate'})[0]||{}).href||'#';
 var img='';
 if(e.media$thumbnail&&e.media$thumbnail.url)img=e.media$thumbnail.url;
 else{var m=((e.content&&e.content.$t)||(e.summary&&e.summary.$t)||'').match(/<img[^>]+src=["']([^"']+)/i);img=m?m[1]:''}
 img=img?img.replace(/\/s72-c\//,'/s640/').replace(/=s72-c/,'=s640'):(pbtSafe.noThumb||'');
 var isVideo=/ytimg\.com|youtube\.com|youtu\.be/i.test(img)||/<iframe[^>]+youtube/i.test((e.content&&e.content.$t)||'');
 var idm=((e.id&&e.id.$t)||'').match(/post-(\d+)/);
 var author=(e.author&&e.author[0]&&e.author[0].name&&e.author[0].name.$t)||'';
 var dt='';try{dt=new Date(e.published.$t).toLocaleDateString(root.lang||'ms-MY',{year:'numeric',month:'short',day:'numeric'})}catch(x){}
 return{
  id:idm?idm[1]:'',
  title:(e.title&&e.title.$t)||'',
  url:link,
  img:img,
  isVideo:isVideo,
  category:e.category&&e.category.length?e.category[0].term:'',
  summary:text((e.summary&&e.summary.$t)||(e.content&&e.content.$t)||'').slice(0,170),
  author:author,
  dateText:dt,
  datetime:(e.published&&e.published.$t)||''
 };
}
function imgHtml(post,opts){
 opts=opts||{};
 var badge=(opts.icon!==false&&post.isVideo)?'<span class="yt-img'+(opts.size?':x'+opts.size:'')+'"></span>':'';
 /* These widgets are built from an already-fetched feed response, so the image URL is on hand
    immediately - paint it straight away (class pbt-lazy triggers the opacity:0->1 CSS transition)
    instead of routing it through data-src + IntersectionObserver a second time, which was leaving
    thumbnails permanently blank whenever the observer never got a chance to re-check the element. */
 var style=post.img?' style="background-image:url(&quot;'+esc(post.img).replace(/"/g,'&quot;')+'&quot;)"':'';
 var inner='<div class="thumbnail pbt-lazy"'+style+'></div>'+badge;
 if(opts.link===false)return '<div class="entry-thumbnail">'+inner+'</div>';
 var tgt=opts.target?' target="'+esc(opts.target)+'"':'';
 return '<a class="entry-thumbnail" href="'+esc(post.url)+'"'+tgt+'>'+inner+'</a>';
}
function tagHtml(post){return post.category?'<span class="entry-tag">'+esc(post.category)+'</span>':''}
function titleHtml(post,opts){
 opts=opts||{};
 var tgt=opts.target?' target="'+esc(opts.target)+'"':'';
 var t=opts.link===false?esc(post.title):'<a href="'+esc(post.url)+'"'+tgt+'>'+esc(post.title)+'</a>';
 return '<h2 class="entry-title">'+t+'</h2>';
}
function summaryHtml(post){return post.summary?'<span class="entry-excerpt excerpt">'+esc(post.summary)+'</span>':''}
function metaHtml(post,opts){
 opts=opts||{};
 var a=(opts.author!==false&&post.author)?'<span class="entry-author"><span class="author-name">'+esc(post.author)+'</span></span>':'';
 var dt=(opts.date!==false&&post.dateText)?'<span class="entry-time"><time class="published" datetime="'+esc(post.datetime)+'">'+esc(post.dateText)+'</time></span>':'';
 return (a||dt)?'<div class="entry-meta">'+a+dt+'</div>':'';
}
/* one grid "post" card */
function postCardHtml(post,opts){
 opts=opts||{};
 return '<div class="post">'+imgHtml(post,opts)+'<div class="entry-header">'+
  (opts.tag!==false?tagHtml(post):'')+titleHtml(post,opts)+(opts.summary?summaryHtml(post):'')+metaHtml(post,opts)+
  '</div></div>';
}

/* ---------------------------------------------------------------------
   Per-type widget assembly (ports the getPosts success handler + getPostContent switch)
--------------------------------------------------------------------- */
function buildItemsHtml(type,posts,extra){
 extra=extra||{};
 if(!posts.length)return '';
 var i,html;
 switch(type){
  case 'block1':
   html='<div class="block1-items"><div class="first">'+imgHtml(posts[0])+'<div class="entry-header">'+tagHtml(posts[0])+titleHtml(posts[0])+summaryHtml(posts[0])+metaHtml(posts[0])+'</div></div>';
   if(posts.length>1){
    html+='<div class="block1-list">';
    for(i=1;i<posts.length;i++)html+='<div class="post">'+imgHtml(posts[i],{size:'3'})+'<div class="entry-header">'+titleHtml(posts[i])+metaHtml(posts[i],{author:false})+'</div></div>';
    html+='</div>';
   }
   return html+'</div>';
  case 'block2':
   html='<div class="block2-items"><div class="post card cs"><a class="entry-inner" href="'+esc(posts[0].url)+'">'+imgHtml(posts[0],{link:false})+'<div class="entry-header">'+tagHtml(posts[0])+titleHtml(posts[0],{link:false})+metaHtml(posts[0])+'</div></a></div>';
   if(posts.length>1){
    html+='<div class="block2-grid">';
    for(i=1;i<posts.length;i++)html+=postCardHtml(posts[i],{summary:true});
    html+='</div>';
   }
   return html+'</div>';
  case 'video':
   html='<div class="video-items"><div class="first">'+imgHtml(posts[0])+'<div class="entry-header">'+tagHtml(posts[0])+titleHtml(posts[0])+summaryHtml(posts[0])+metaHtml(posts[0])+'</div></div>';
   if(posts.length>1){
    html+='<div class="video-grid">';
    for(i=1;i<posts.length;i++)html+='<div class="post">'+imgHtml(posts[i],{size:'3'})+'<div class="entry-header">'+titleHtml(posts[i])+metaHtml(posts[i],{author:false})+'</div></div>';
    html+='</div>';
   }
   return html+'</div>';
  case 'story':
   html='<div class="story-items">';
   posts.forEach(function(p){html+='<div class="post card cs"><a class="entry-inner" href="'+esc(p.url)+'">'+imgHtml(p,{link:false})+'<div class="entry-header">'+titleHtml(p,{link:false})+metaHtml(p,{author:false})+'</div></a></div>'});
   return html+'</div>';
  case 'featured':
   html='<div class="featured-items'+(posts.length>1?'':' single')+'"><div class="first"><a class="entry-inner flex-c" href="'+esc(posts[0].url)+'"><div class="container">'+imgHtml(posts[0],{icon:false,link:false})+'<div class="entry-header">'+tagHtml(posts[0])+titleHtml(posts[0],{link:false})+metaHtml(posts[0])+'</div></div></a></div>';
   if(posts.length>1){
    html+='<div class="grid">';
    for(i=1;i<Math.min(posts.length,4);i++)html+=postCardHtml(posts[i],{size:'4',author:false});
    html+='</div>';
   }
   return html+'</div>';
  case 'mega': case 'megatabs':
   html='<div class="mega-items">';
   posts.forEach(function(p,idx){html+='<div class="post fadeInDown" style="animation-delay:'+(0.1*idx).toFixed(1)+'s;">'+imgHtml(p,{size:'2'})+'<div class="entry-header">'+titleHtml(p)+metaHtml(p,{author:false})+'</div></div>'});
   return html+'</div>';
  case 'related':
   html='<div class="related-items">';
   posts.forEach(function(p){html+=postCardHtml(p,{size:'2',author:false})});
   return html+'</div>';
  case 'side':
   html='<div class="side-items">';
   posts.forEach(function(p){html+=postCardHtml(p,{size:'3',author:false})});
   return html+'</div>';
  case 'card':
   return imgHtml(posts[0],{size:'2'})+'<div class="entry-header">'+(extra.headline||'')+titleHtml(posts[0])+metaHtml(posts[0])+'</div>';
  case 'list':
   html='<div class="list-items">';
   posts.forEach(function(p){html+=postCardHtml(p,{summary:true})});
   return html+'</div>';
  default: /* grid */
   html='<div class="grid-items">';
   posts.forEach(function(p){html+=postCardHtml(p,{summary:true})});
   return html+'</div>';
 }
}
function msgError(){return '<span class="error-msg"><b>Ralat:</b>&nbsp;'+esc(pbtSafe.noResults||'Tiada catatan ditemui.')+' <button type="button" class="retry-feed">Cuba lagi</button></span>'}

/* ---------------------------------------------------------------------
   Widget loader — fetches a feed and renders it into a .widget-content,
   applying the type-{type} class the theme's CSS actually keys off
   (its absence is why some sections — e.g. type-story — never got their
   horizontal-scroll/overflow treatment and looked squashed into one row).
--------------------------------------------------------------------- */
function loadSection(el,opts){
 opts=opts||{};
 var type=opts.type||'grid',n=opts.num||6,label=opts.label||'',excludeId=opts.id||'';
 el.removeAttribute('aria-hidden');el.setAttribute('aria-busy','true');
 if(el.parentElement)el.parentElement.classList.add('type-'+type);
 feed(label,excludeId?n+1:n,function(entries){
  el.removeAttribute('aria-busy');
  if(excludeId)entries=entries.filter(function(e){return ((e.id&&e.id.$t)||'').indexOf('post-'+excludeId)===-1}).slice(0,n);
  if(!entries.length){
   if(type==='related'&&label){var o={};for(var k in opts)o[k]=opts[k];o.label='';loadSection(el,o);return}
   el.innerHTML=msgError();return
  }
  var posts=entries.map(postFromEntry);
  el.innerHTML=buildItemsHtml(type,posts,opts);
  observeLazy(el);
  if(type==='card')getPostCard(el);
 });
}
/* IntersectionObserver replaces the old blanket 150ms-stagger loop: each widget
   fetches only once it's actually about to scroll into view, so a below-fold
   widget no longer waits behind every earlier widget's delay + fetch time. */
function whenNear(el,cb){
 if('IntersectionObserver' in w){
  var io=new IntersectionObserver(function(es,o){es.forEach(function(e){if(e.isIntersecting){o.disconnect();cb()}})},{rootMargin:'400px 0px'});
  io.observe(el);
 } else cb();
}
function initFeeds(){
 qa('.featured .getPosts').forEach(function(wrap){
  var el=q('.widget-content',wrap),sc=el&&el.getAttribute('data-shortcode');if(!el||!sc)return;
  var label=attr(sc,'label','');el.removeAttribute('data-shortcode');
  whenNear(el,function(){loadSection(el,{type:'featured',num:4,label:label})});
 });
 qa('.content-section .getPosts').forEach(function(wrap){
  var el=q('.widget-content',wrap),sc=el&&el.getAttribute('data-shortcode');if(!el||!sc)return;
  var label=attr(sc,'label','recent'),type=attr(sc,'type','block1'),results=attr(sc,'results','');
  var n=results?parseInt(results,10):(type==='block1'||type==='video'?5:type==='story'?3:type==='block2'?5:4);
  el.removeAttribute('data-shortcode');
  if(label&&label!=='recent'){var tl=q('.title-link',wrap.parentElement||wrap);if(tl)tl.setAttribute('href',label==='recent'?'/search':'/search/label/'+encodeURIComponent(label))}
  whenNear(el,function(){loadSection(el,{type:type,num:n,label:label==='recent'?'':label})});
 });
 qa('.sidebar .getPosts, .footer .getPosts, .footer-widgets .getPosts').forEach(function(wrap){
  var el=q('.widget-content',wrap),sc=el&&el.getAttribute('data-shortcode');if(!el||!sc)return;
  var results=attr(sc,'results','4'),label=attr(sc,'label','');
  el.removeAttribute('data-shortcode');
  whenNear(el,function(){loadSection(el,{type:'side',num:parseInt(results,10)||4,label:label})});
 });
 qa('.main-nav .has-mega').forEach(function(mega){
  var a=q('a',mega),sc=a&&a.getAttribute('data-shortcode'),label=attr(sc,'label','recent'),parts=label.split('/').filter(Boolean);
  if(parts.length>1){
   mega.classList.add('type-tabs');
   var box=q('.container',mega);
   if(box){
    var navHtml='',tabsHtml='';
    parts.slice(0,5).forEach(function(t,i){navHtml+='<a href="/search/label/'+encodeURIComponent(t)+'"'+(i===0?' class="active"':'')+'>'+esc(t)+'</a>';tabsHtml+='<div data-tab="'+esc(t)+'"'+(i===0?' class="active"':'')+'></div>'});
    box.innerHTML='<div class="mega-tabs"><div class="nav">'+navHtml+'</div><div class="tabs">'+tabsHtml+'</div></div>';
    if(a)a.removeAttribute('data-shortcode');
    var loadedTabs={};
    function loadTab(t){var tab=q('[data-tab="'+t.replace(/"/g,'')+'"]',box);if(!tab||loadedTabs[t])return;loadedTabs[t]=true;loadSection(tab,{type:'megatabs',num:5,label:t})}
    on(mega,'mouseenter',function(){loadTab(parts[0])},{once:true});
    qa('.nav a',box).forEach(function(link,idx){on(link,'mouseenter',function(e){e.preventDefault();qa('.nav a',box).forEach(function(x){x.classList.remove('active')});qa('[data-tab]',box).forEach(function(x){x.classList.remove('active')});link.classList.add('active');var tab=qa('[data-tab]',box)[idx];if(tab)tab.classList.add('active');loadTab(parts[idx])})});
   }
  } else {
   mega.classList.add('type-mega');
   if(a){a.setAttribute('href',label==='recent'?'/search':'/search/label/'+encodeURIComponent(label));a.removeAttribute('data-shortcode')}
   var box2=q('.container',mega);
   on(mega,'mouseenter',function(){if(mega.classList.contains('loaded')||!box2)return;mega.classList.add('loaded');loadSection(box2,{type:'mega',num:5,label:label})},{once:true});
  }
 });
 /* The "Related Posts" widget slot (#related-posts) and the actual .related-wrap markup it
    configures are two SEPARATE elements in this theme: the widget slot only carries the
    $label=/$results= config on a bare, empty div, while .related-wrap (with the .related-tag
    holding the current post's id/label) is inserted separately just before the comments block.
    Scoping the lookup to "#related-posts .related-wrap" (as if one contained the other) never
    matched anything, which is why the related-posts section silently rendered nothing. */
 var relatedCfg=q('#related-posts [data-shortcode]');
 var related=q('.related-wrap');
 if(related){
  var tag=q('.related-tag',related),el=q('.widget-content',related);
  if(tag&&el){
   var relLabel=tag.getAttribute('data-label')||'',relId=tag.getAttribute('data-id')||'',sc=relatedCfg?relatedCfg.getAttribute('data-shortcode'):'';
   var results=attr(sc,'results',''),wantLabel=attr(sc,'label','');
   var n=results?parseInt(results,10)+1:4;
   var useLabel=(wantLabel&&wantLabel!==relLabel&&wantLabel!=='related')?wantLabel:relLabel;
   whenNear(el,function(){loadSection(el,{type:'related',num:n,label:useLabel,id:relId})});
  }
 }
}
function getPostCard(scope){
 qa('.post-card[data-url]',scope||d).forEach(function(el){
  var url=el.getAttribute('data-url'),title=el.getAttribute('data-title'),target=el.getAttribute('data-target');
  if(!url){el.innerHTML=msgError();return}
  var headline=title?'<span class="entry-headline">'+esc(title)+'</span>':'';
  el.removeAttribute('data-url');el.removeAttribute('data-title');el.removeAttribute('data-target');
  whenNear(el,function(){
   feed('',1,function(entries){ /* fallback: fetch target post's own permalink via its label/search is non-trivial client-side; use provided single entry from its own feed page is out of scope */ });
   /* Fetch the specific post by resolving its JSON via the same-domain URL + ?alt=json */
   var s=d.createElement('script'),name='__tbbCard'+(++jsonpN);
   w[name]=function(data){try{delete w[name]}catch(e){}if(s.parentNode)s.parentNode.removeChild(s);
    var entry=data&&data.feed&&data.feed.entry&&data.feed.entry[0];
    if(!entry){el.innerHTML=msgError();return}
    var post=postFromEntry(entry);
    el.innerHTML=buildItemsHtml('card',[post],{headline:headline,target:target});
    observeLazy(el);
   };
   s.onerror=function(){el.innerHTML=msgError();if(s.parentNode)s.parentNode.removeChild(s)};
   s.src=url.replace(/\.html.*$/,'')+'.html?alt=json-in-script&callback='+name;
   d.head.appendChild(s);
  });
 });
}

/* ---------------------------------------------------------------------
   TOC — ports the $.fn.pbtToc plugin (heading id assignment + nested <ol> build)
--------------------------------------------------------------------- */
function buildToc(contentSel,ol,headingsSel){
 var levels=headingsSel.split(',').map(function(s){return s.trim()});
 var used={};
 var heads=qa(headingsSel,q(contentSel)).filter(function(h){return (h.textContent||'').trim()!==''});
 heads.forEach(function(h){
  if(h.id)return;
  var base=(h.textContent||'?').replace(/[^a-zA-Z ]/g,'').replace(/\s+/g,'_')||'_',id=base,n=1;
  while(d.getElementById(id)||used[id])id=base+'_'+(n++);
  h.id=id;used[id]=true;
 });
 var stack=[ol],lastLevel=-1;
 heads.forEach(function(h){
  var lvl=levels.indexOf(h.tagName.toLowerCase());if(lvl<0)return;
  if(lastLevel<0)lastLevel=lvl;
  if(lvl>lastLevel){
   var parentLi=stack[stack.length-1].querySelector(':scope > li:last-child');
   if(parentLi){var newOl=d.createElement('ol');parentLi.appendChild(newOl);stack.push(newOl)}
  } else if(lvl<lastLevel&&stack.length>1){
   stack.pop();
  }
  var li=d.createElement('li'),a=d.createElement('a');
  a.href='#'+h.id;a.textContent=h.textContent.trim();li.appendChild(a);
  stack[stack.length-1].appendChild(li);
  lastLevel=lvl;
 });
}

/* ---------------------------------------------------------------------
   Post-body shortcode engine — ports the .post-body blockquote/b/a handlers
--------------------------------------------------------------------- */
function processBlockquotes(){
 var map=[{sc:'{alertSuccess}',cls:'success'},{sc:'{alertInfo}',cls:'info'},{sc:'{alertWarning}',cls:'warning'},{sc:'{alertError}',cls:'error'},{sc:'{codeBox}',cls:'code'}];
 qa('.post-body blockquote').forEach(function(bq){
  var t=(bq.textContent||'').trim(),html=bq.innerHTML;
  map.some(function(m){
   if(t.indexOf(m.sc)===-1)return false;
   html=html.replace(m.sc,'');
   var div=d.createElement(m.cls==='code'?'pre':'div');
   div.className=m.cls==='code'?'code-box':'alert-message alert-'+m.cls;
   div.innerHTML=html;
   bq.parentNode.replaceChild(div,bq);
   return true;
  });
 });
}
function processBoldTags(){
 qa('.post-body b').forEach(function(b){
  var t=(b.textContent||'').trim();
  function has(re){return re.test?re.test(t):t.indexOf(re)!==-1}
  if(has('{inAds}')||has('{ads}')||has(/\$ads=\{1\}/)||has(/\$ads=\{2\}/)){var a=d.createElement('div');a.className='article-ads';b.parentNode.replaceChild(a,b);return}
  if(has('{showAds}')){b.parentNode.removeChild(b);return}
  if(has('{nextPage}')){var c=d.createComment('nextpage');b.parentNode.replaceChild(c,b);return}
  if(has('{getToc}')){
   var title=attr(t,'title','Kandungan')||'Table of Contents',count=attr(t,'count',''),expanded=attr(t,'expanded','');
   var wrap=d.createElement('div');wrap.className='pbt-toc-wrap';
   wrap.innerHTML='<div class="pbt-toc-inner"><button type="button" class="pbt-toc-title" aria-label="'+esc(title)+'"><span class="pbt-toc-title-text">'+esc(title)+'</span></button><ol id="pbt-toc" data-count="'+esc(count||'true')+'"></ol></div>';
   b.parentNode.replaceChild(wrap,b);
   var ol=q('#pbt-toc',wrap),btn=q('.pbt-toc-title',wrap);
   buildToc('.post-body',ol,'h2,h3,h4');
   if(expanded==='true'){btn.classList.add('is-expanded');ol.style.display='block'}
   on(btn,'click',function(){btn.classList.toggle('is-expanded');ol.style.display=ol.style.display==='block'?'none':'block'});
   qa('a',ol).forEach(function(a){on(a,'click',function(e){e.preventDefault();var target=q(a.getAttribute('href'));if(target)w.scrollTo({top:target.getBoundingClientRect().top+w.scrollY-20,behavior:'smooth'})})});
   return;
  }
  if(t.indexOf('{contactForm}')!==-1){
   var cf=d.createElement('div');cf.className='contact-form-widget';
   b.parentNode.replaceChild(cf,b);
   var src=q('#ContactForm1 form');if(src)cf.appendChild(src);
   return;
  }
  var sideMap=[{sc:'{leftSidebar}',cls:'is-left'},{sc:'{rightSidebar}',cls:'is-right'},{sc:'{noSidebar}',cls:'no-sidebar'},{sc:'{fullWidth}',cls:'no-sidebar'}];
  var handledSide=sideMap.some(function(m){
   if(t.indexOf(m.sc)===-1)return false;
   if(!/is-left|is-right|no-sidebar/.test(body.className)){body.classList.add(m.cls);if(m.cls==='is-right')body.classList.remove('is-left')}
   b.parentNode.removeChild(b);
   return true;
  });
  if(handledSide)return;
  if(t.indexOf('{getLink}')!==-1){
   var secs=attr(t,'seconds','15'),before=attr(t,'before','Generate Link'),after=attr(t,'after','Go to Link'),msg=attr(t,'message','Please wait...'),sz=attr(t,'size','');
   var lw=d.createElement('div');lw.className='flex-c';
   lw.innerHTML='<div class="gd-link"><div class="gd-countdown"><span class="gd-seconds">'+esc(secs)+'</span><span class="gd-message">'+esc(msg)+'</span></div>'+
    '<button type="button" class="get-link button btn link'+(sz?' x2':'')+'" disabled>'+esc(before)+'</button>'+
    '<button type="button" class="goto-link button btn link'+(sz?' x2':'')+'">'+esc(after)+'</button></div>';
   b.parentNode.replaceChild(lw,b);
   var linkBox=q('.gd-link',lw),getBtn=q('.get-link',linkBox),gotoBtn=q('.goto-link',linkBox),secEl=q('.gd-seconds',linkBox);
   var url=new URL(location.href.replace('#',location.href.indexOf('?')>-1?'&':'?')),params=new URLSearchParams(url.search);
   var gd=params.get('gd'),go=params.get('go'),left=(parseInt(secs,10)||15)-1;
   try{localStorage.gd_key=gd||0;localStorage.go_key=go||0}catch(e){}
   if(gd||go){
    getBtn.removeAttribute('disabled');
    on(getBtn,'click',function(){
     if(getBtn.hasAttribute('disabled'))return;
     linkBox.classList.add('loading');
     var timer=setInterval(function(){
      if(left<=0){clearInterval(timer);linkBox.classList.add('loaded');linkBox.classList.remove('loading');qa('.gd-btn').forEach(function(x){x.removeAttribute('disabled')})}
      else{secEl.textContent=left;left--}
     },1000);
    });
   }
   on(gotoBtn,'click',function(){var gb=q('.gd-btn');if(gb)w.scrollTo({top:gb.getBoundingClientRect().top+w.scrollY-w.innerHeight/2+gb.offsetHeight/2,behavior:'smooth'})});
   return;
  }
  if(t.indexOf('{getDownload}')!==-1){
   var dlBtn=attr(t,'button','Download'),dlSize=attr(t,'size','');
   var dw=d.createElement('div');dw.className='flex-c';
   dw.innerHTML='<button type="button" class="gd-btn button btn download has-loader'+(dlSize?' x2':'')+'" disabled>'+esc(dlBtn)+'</button>';
   b.parentNode.replaceChild(dw,b);
   qa('.gd-btn',dw).forEach(function(btn){on(btn,'click',function(){
    if(btn.hasAttribute('disabled'))return;
    var gk,gok;try{gk=localStorage.gd_key;gok=localStorage.go_key}catch(e){}
    var target=(gk&&gk!=='0')?'https://drive.google.com/uc?id='+atob(gk)+'&export=download':((gok&&gok!=='0')?atob(gok):'');
    if(target){btn.classList.add('loading');setTimeout(function(){w.open(target,'_self');btn.classList.remove('loading')},2000)}
   })});
   return;
  }
  if(t.indexOf('{getContinue}')!==-1){
   var goBtnLabel=attr(t,'button','Continue'),goSize=attr(t,'size','2');
   var gw=d.createElement('div');gw.className='flex-c';
   gw.innerHTML='<button type="button" class="go-btn button btn continue has-loader'+(goSize==='1'?' x1':' x2')+'" disabled>'+esc(goBtnLabel)+'</button>';
   b.parentNode.replaceChild(gw,b);
   var goBtn=q('.go-btn',gw);
   var url2=new URL(location.href.replace('#',location.href.indexOf('?')>-1?'&':'?')),go2=new URLSearchParams(url2.search).get('go');
   var dest=go2?atob(go2):'';
   if(dest){goBtn.removeAttribute('disabled');on(goBtn,'click',function(){if(goBtn.hasAttribute('disabled'))return;goBtn.classList.add('loading');setTimeout(function(){w.open(dest,'_self');goBtn.classList.remove('loading')},2000)})}
   return;
  }
 });
}
function processAnchorTags(){
 qa('.post-body a').forEach(function(a){
  var t=(a.textContent||'').trim();
  if(t.indexOf('getButton')!==-1){
   var label=attr(t,'text','')||a.textContent,icon=attr(t,'icon',''),color=attr(t,'color',''),size=attr(t,'size',''),info=attr(t,'info',''),idParam=attr(t,'id','');
   a.className=size?'button btn x2':'button btn';
   a.textContent=label;
   if(idParam)a.href=a.getAttribute('href')+'#gd='+btoa(idParam);
   if(icon&&icon!=='false')a.classList.add(icon);
   if(color){a.classList.add('color');a.style.background=color}
   if(info){a.classList.add(icon?'x2 '+icon:'x2');var infoSpan=d.createElement('span');infoSpan.className='btn-info';infoSpan.textContent=info;a.appendChild(infoSpan)}
   return;
  }
  if(t.indexOf('getCard')!==-1){
   var type=attr(t,'type','custom'),href=a.getAttribute('href')||'#',target=a.getAttribute('target')||'_self';
   if(type==='download'||type==='product'||type==='custom'){
    var btnLbl=attr(t,'button',''),cardIcon=attr(t,'icon',''),cardTitle=attr(t,'title',''),info2=attr(t,'info',''),cardId=attr(t,'id','');
    var infoHtml=info2?'<span class="card-meta">'+esc(info2)+'</span>':'';
    var defaultIcon=type==='download'?'&#xF295;':(type==='product'?'&#xF242;':'&#xF4B1;');
    var cardHref=type==='download'&&cardId?href+'#gd='+btoa(cardId):href;
    var div=d.createElement('div');div.className='cta-card '+type;
    div.innerHTML='<div class="card-header"><div class="card-icon"><i class="bi" data-icon="'+esc(cardIcon||defaultIcon)+'"></i></div><div class="card-info"><span class="card-title">'+esc(cardTitle||pbtSafe.noTitle||'')+'</span>'+infoHtml+'</div></div>'+
     '<a class="card-btn btn" href="'+esc(cardHref)+'" target="'+esc(target)+'">'+(btnLbl?esc(btnLbl):'<i class="bi bi-box-arrow-up-right"></i>')+'</a>';
    a.parentNode.replaceChild(div,a);
   } else {
    var title=attr(t,'title','');
    var pc=d.createElement('div');pc.className='post-card';
    pc.setAttribute('data-url',href);if(title)pc.setAttribute('data-title',title);pc.setAttribute('data-target',target);
    a.parentNode.replaceChild(pc,a);
   }
  }
 });
}
function processAdsMarkers(){
 var map=[['.before-ads','#post-ads-1'],['.after-ads','#post-ads-2'],['.article-ads','#post-ads-3'],['.post-footer-ads','#post-ads-4']];
 map.forEach(function(pair){
  qa(pair[0]).forEach(function(marker){
   var slot=q(pair[1]);
   if(slot){var ns=q('noscript',slot);if(ns){var wrap=d.createElement('div');wrap.className='widget';wrap.innerHTML=ns.textContent;marker.innerHTML='';marker.appendChild(wrap)}}
  });
 });
}
function processPagination(){
 qa('.pagination').forEach(function(pag){
  var scope=pag.closest('.post-inner')||pag.parentElement||d;
  var postBody=q('.post-body',scope);
  if(!postBody)return;
  var raw=postBody.innerHTML,parts=raw.split(/<!--\s*nextpage\s*-->/i);
  if(parts.length<2)return;
  var total=parts.length;
  function render(){
   var url=new URL(location.href.replace('#',location.href.indexOf('?')>-1?'&':'?')),page=parseInt(new URLSearchParams(url.search).get('page'),10)||1;
   var idx=Math.max(0,Math.min(page-1,total-1));
   postBody.innerHTML=parts[idx];
   var pageOf='Page {page} of {pages}',prevLbl='Previous',nextLbl='Next',n=idx+1;
   var prevHtml=n>1?'<a href="#page='+(idx)+'" class="prev btn">'+prevLbl+'</a>':'';
   var nextHtml=n<total?'<a href="#page='+(idx+2)+'" class="next btn">'+nextLbl+'</a>':'';
   pag.innerHTML=prevHtml+'<span class="info">'+pageOf.replace('{page}',n).replace('{pages}',total)+'</span>'+nextHtml;
   pag.classList.add('visible');
   qa('.btn',pag).forEach(function(btn){on(btn,'click',function(){w.scrollTo({top:0,behavior:'smooth'})})});
   getPostCard(postBody);
   observeLazy(postBody);
   processBlockquotes();processBoldTags();processAnchorTags();
  }
  on(w,'hashchange',render);
  render();
 });
}
function processPostBody(){
 processBlockquotes();
 processBoldTags();
 processAnchorTags();
 processAdsMarkers();
 processPagination();
}

/* ---------------------------------------------------------------------
   UI chrome: menu / dark-mode / search / to-top / mega-menu handled above
--------------------------------------------------------------------- */
function initMenu(){
 qa('#main-menu .widget').forEach(function(wg){wg.classList.add('is-ready')});
 var main=q('.main-nav'); if(main){
   var links=qa('a',main),parents={1:null,2:null};
   links.forEach(function(a,i){var t=(a.textContent||'').trim();if(t.charAt(0)==='_'){var level=t.indexOf('__')===0?2:1;a.textContent=t.replace(/^_+/,'');var prev=links[i-1];if(prev){var li=prev.closest('li');if(li){var ul=q('.sm-'+level,li);if(!ul){ul=d.createElement('ul');ul.className='ul sub sm-'+level;li.appendChild(ul);li.classList.add('has-sub')}ul.appendChild(a.closest('li'))}}}});
   var mob=q('.mobile-menu');if(mob&&!q('.mobile-nav',mob)){var clone=main.cloneNode(true);clone.className='mobile-nav';clone.removeAttribute('id');mob.appendChild(clone)}
 }
 qa('.mobile-menu .has-sub > a').forEach(function(a){on(a,'click',function(e){var li=a.parentElement,sub=q('.sub',li);if(sub){e.preventDefault();li.classList.toggle('expanded');sub.style.display=li.classList.contains('expanded')?'block':'none'}})});
 var mlog=q('.mobile-logo');if(mlog&&!mlog.firstElementChild){var lg=q('.main-logo a');if(lg){var lgClone=lg.cloneNode(true);var h1=q('h1',lgClone);if(h1)h1.remove();mlog.appendChild(lgClone)}}
 /* mobile slide-menu footer: clone footer social + footer menu into .mm-footer (was entirely missing) */
 qa('.mm-footer').forEach(function(mm){
  if(mm.firstElementChild)return;
  var social=q('.footer-info .social'),fmenu=q('.footer-menu ul');
  if(social){var sc=social.cloneNode(true);sc.className='social color';var txt=q('.text',sc);if(txt)txt.remove();mm.appendChild(sc)}
  if(fmenu){var fc=fmenu.cloneNode(true);fc.className='links';mm.appendChild(fc)}
 });
}
function darkLogo(isDark){
 qa('[data-dark-src]').forEach(function(im){var src=im.getAttribute(isDark?'data-dark-src':'data-src');if(src)im.src=src});
}
function initUI(){
 var overlay=q('.overlay-bg');
 qa('.menu-toggle,.hide-mobile-menu').forEach(function(b){on(b,'click',function(){body.classList.toggle('menu-on');body.classList.toggle('show-overlay',body.classList.contains('menu-on'))})});
 qa('.search-toggle').forEach(function(b){on(b,'click',function(){body.classList.add('search-on','show-overlay');var i=q('.main-search .input');if(i)setTimeout(function(){i.focus()},40)})});
 function close(){body.classList.remove('menu-on','search-on','show-overlay')}
 on(overlay,'click',close);qa('.main-search .close').forEach(function(b){on(b,'click',close)});
 on(d,'keydown',function(e){if(e.key==='Escape')close()});
 var sIn=q('.main-search .input');if(sIn){sIn.setAttribute('enterkeyhint','search');on(sIn,'keydown',function(e){if((e.key==='Enter'||e.keyCode===13)&&sIn.value.trim()){e.preventDefault();location.href='/search?q='+encodeURIComponent(sIn.value.trim())}})}
 /* live search results, ported from getSearch()/getPosts(type:"search") */
 var searchInput=q('.main-search input'),searchResults=q('.main-search .search-results'),searchTimer;
 if(searchInput&&searchResults){
  on(searchInput,'input',function(){
   clearTimeout(searchTimer);
   var term=searchInput.value.trim();
   var sBox=q('.main-search'),sPane=searchResults.parentElement;
   if(!term){searchResults.innerHTML='';if(sPane)sPane.classList.remove('visible');return}
   searchTimer=setTimeout(function(){
    if(sBox)sBox.classList.add('loading');
    feed('',5,function(entries){
     if(sBox)sBox.classList.remove('loading');
     if(sPane)sPane.classList.add('visible');
     var posts=entries.map(postFromEntry);
     searchResults.innerHTML=posts.length?buildItemsHtml('grid',posts):msgError();
     observeLazy(searchResults);
     setTimeout(function(){searchResults.classList.add('scroll')},500);
    },term);
   },500);
  });
 }
 var dark=q('.darkmode-toggle');if(dark){var saved='';try{saved=localStorage.getItem('tbb-theme')||''}catch(e){}if(saved==='dark'||root.classList.contains('is-dark')){root.classList.add('is-dark');darkLogo(true)}on(dark,'click',function(){var isDark=root.classList.toggle('is-dark');darkLogo(isDark);try{localStorage.setItem('tbb-theme',isDark?'dark':'light')}catch(e){}})}
 var top=q('.to-top');if(top){
  var footer=q('.site-footer');
  on(w,'scroll',function(){
   top.classList.toggle('show',w.scrollY>=100);
   if(footer)top.classList.toggle('on-footer',(top.getBoundingClientRect().top+w.scrollY)>=(footer.getBoundingClientRect().top+w.scrollY-36));
  },{passive:true});
  on(top,'click',function(){w.scrollTo({top:0,behavior:'smooth'})});
 }
 /* #load-more AJAX pagination */
 var loadMore=q('#load-more');
 if(loadMore){
  var loadingEl=q('.blog-pager .loading'),noMoreEl=q('.blog-pager .no-more'),nextUrl=loadMore.getAttribute('data-url');
  on(loadMore,'click',function(e){
   e.preventDefault();if(!nextUrl)return;
   loadMore.classList.remove('visible');
   if(loadingEl)loadingEl.classList.add('visible');
   fetch(nextUrl).then(function(r){return r.text()}).then(function(html){
    var doc=new DOMParser().parseFromString(html,'text/html');
    var newPosts=q('.blog-posts',doc);
    if(newPosts){
     qa('.post',newPosts).forEach(function(p,i){p.classList.add('fadeInUp');p.style.animationDelay=(0.1*i).toFixed(1)+'s'});
     var target=q('.blog-posts');if(target)target.insertAdjacentHTML('beforeend',newPosts.innerHTML);
    }
    var nextBtn=q('#load-more',doc);
    nextUrl=nextBtn?nextBtn.getAttribute('data-url'):'';
    if(nextUrl)loadMore.classList.add('visible');else if(noMoreEl)noMoreEl.classList.add('visible');
   }).catch(function(){loadMore.classList.add('visible')}).finally(function(){
    if(loadingEl)loadingEl.classList.remove('visible');
    observeLazy(d);
   });
  });
 }
 /* comment {image}/{video} shortcodes on native Blogger comments */
 qa('p.comment-content').forEach(function(p){
  p.innerHTML=p.innerHTML.replace(/\{image\}([^{}]*)\{\/image\}/g,'<img class="comment-image" src="$1" alt="Comment Image" loading="lazy"/>');
  p.innerHTML=p.innerHTML.replace(/\{video\}([^{}]*)\{\/video\}/g,function(m,url){
   var vid='';var yt=url.match(/[?&]v=([^&]+)/)||url.match(/youtu\.be\/([^?&]+)/);
   if(yt)vid=yt[1];
   return vid?'<div class="comment-video" data-id="'+esc(vid)+'"><img width="100%" height="315" src="https://i.ytimg.com/vi/'+esc(vid)+'/hqdefault.jpg" alt="YouTube Video Cover" loading="lazy"/><span class="yt-img"></span></div>':'Error: '+esc(pbtSafe.noResults||'');
  });
  qa('.comment-video',p).forEach(function(cv){on(cv,'click',function(){var id=cv.getAttribute('data-id');cv.outerHTML='<iframe width="100%" height="315" src="https://www.youtube.com/embed/'+esc(id)+'" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'})});
 });
 /* cookie consent (plain document.cookie, no js-cookie dependency needed) */
 function getCookie(name){var m=d.cookie.match('(^|;)\\s*'+name+'\\s*=\\s*([^;]+)');return m?m.pop():''}
 function setCookie(name,val,days){var exp=new Date();exp.setTime(exp.getTime()+days*864e5);d.cookie=name+'='+val+';expires='+exp.toUTCString()+';path=/'}
 var consent=q('.cookie-consent');
 if(consent){
  var btn=q('.consent-button',consent);
  if(getCookie('cookie_consent')!=='true'){consent.style.display='block';on(w,'load',function(){consent.classList.add('visible')})}
  if(btn)on(btn,'click',function(e){e.stopPropagation();setCookie('cookie_consent','true',7);consent.classList.remove('visible');setTimeout(function(){consent.style.display='none'},500)});
 }
 if(pbtSafe.hasCookie)w.cookieChoices={};
}
function initPost(){
 qa('.post-body table').forEach(function(t){if(!t.parentElement.classList.contains('table-responsive-wrapper')){var x=d.createElement('div');x.className='table-responsive-wrapper';t.parentNode.insertBefore(x,t);x.appendChild(t)}});
 var pt=(d.title.split('|')[0]||'').trim();qa('.post-body img').forEach(function(im){if(!im.alt)im.alt=pt;im.loading=im.loading||'lazy';im.decoding='async'});
 qa('iframe[src*="youtube.com"],iframe[src*="youtu.be"]').forEach(function(f){f.loading='lazy';if(!f.title)f.title='Video'});
 if(q('.post-body'))processPostBody();
}
function initAds(){
 qa('ins.adsbygoogle').forEach(function(ad){var p=ad.parentElement;if(p)p.style.contain='layout style';try{(w.adsbygoogle=w.adsbygoogle||[]).push({})}catch(e){}});
}
/* Sticky header on scroll — ported from the old jQuery engine's initStickyHeader().
   Dropped during the vanilla rewrite, which silently killed the pinned mobile header
   (and the anchor-ad slot riding along with it) with no error, just no .is-fixed/.show. */
function initStickyHeader(){
 if(pbtSafe.stickyMenu==='false')return;
 var header=q('.header-inner'),mainHeader=q('.main-header');
 if(!header||!mainHeader)return;
 var lastY=w.scrollY;
 on(w,'scroll',function(){
  var curY=w.scrollY,threshold=mainHeader.offsetHeight*2;
  if(curY>threshold){
   header.classList.add('is-fixed');
   if(curY<lastY)header.classList.add('show');else header.classList.remove('show');
  } else header.classList.remove('is-fixed','show');
  lastY=curY;
 },{passive:true});
}
/* Mailchimp subscribe form — ported from initMailchimp(). The template always renders the
   submit button disabled and leaves the form action empty until JS wires it from the
   "Advanced" LinkList config (options.subscribeFormUrl/subscribeMessage); without this the
   button was permanently disabled sitewide. */
function initMailchimp(){
 if(!optSafe.subscribeFormUrl)return;
 qa('.MailChimp').forEach(function(box){
  var form=q('.mailchimp-form',box),msg=q('.mailchimp-text',box),btn=q('.mailchimp-submit',box);
  if(msg&&optSafe.subscribeMessage)msg.innerHTML=optSafe.subscribeMessage;
  if(form){
   form.setAttribute('action',optSafe.subscribeFormUrl);
   on(form,'submit',function(){w.open(optSafe.subscribeFormUrl,'popupwindow','scrollbars=yes,width=550,height=520');return true});
  }
  if(btn)btn.removeAttribute('disabled');
 });
}
/* Share-icon popups + copy-link — ported from initShareModal(). Without this, each
   Facebook/Twitter/... icon (class "window-open") just navigated the current tab away to
   the sharer URL instead of opening a popup, and the "copy link" button did nothing. */
function initShareLinks(){
 qa('.window-open').forEach(function(a){
  on(a,'click',function(e){e.preventDefault();w.open(a.href,'_blank','scrollbars=yes,resizable=yes,toolbar=0,width=860,height=540,top=50,left=50')});
 });
 qa('.copy-link').forEach(function(box){
  var input=q('input',box),btn=q('button',box);
  if(!input||!btn)return;
  on(input,'click',function(){input.select()});
  on(btn,'click',function(){
   if(!(navigator.clipboard&&navigator.clipboard.writeText))return;
   navigator.clipboard.writeText(input.value).then(function(){
    box.classList.remove('copied-off');box.classList.add('copied');
    setTimeout(function(){box.classList.remove('copied');box.classList.add('copied-off')},3000);
   });
  });
 });
}
/* Sidebar/footer social follower-count labels — ported from initSocialCounters(). The
   template still emits data-text="true" and a "#<count>" hash on each social link
   expecting this to append the visible count; it was the only piece never re-added. */
function initSocialCounters(){
 qa('.sidebar .social a, .footer-widgets .social a').forEach(function(a){
  var href=a.getAttribute('href')||'',parts=href.split('#'),hasText=a.getAttribute('data-text');
  if(parts[1]&&(hasText==='true'||hasText==='')){
   var val=parts[1].trim();
   if(val){var span=d.createElement('span');span.className='text';span.textContent=val;a.appendChild(span)}
  }
  a.setAttribute('href',parts[0].trim());
 });
}
function initRetry(){
 on(d,'click',function(e){
  var b=e.target&&e.target.closest&&e.target.closest('.retry-feed');if(!b)return;
  var el=b.closest('.widget-content');if(!el)return;
  var parent=el.parentElement,type='grid';
  if(parent){var m=parent.className.match(/type-(\S+)/);if(m)type=m[1]}
  loadSection(el,{type:type,num:6});
 });
}
function start(){initMenu();initUI();initFeeds();initPost();initAds();initRetry();initStickyHeader();initMailchimp();initShareLinks();initSocialCounters();getPostCard();observeLazy(d)}
if(d.readyState==='loading')on(d,'DOMContentLoaded',start);else start();
})();
