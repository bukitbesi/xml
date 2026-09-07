/* The Bukit Besi runtime v2.2.0 — vanilla JavaScript only. */
(()=>{'use strict';

const all=(s,c=document)=>[...c.querySelectorAll(s)],
one=(s,c=document)=>c.querySelector(s),
body=document.body,
cfg=typeof pbt!=='undefined'?pbt:{};

const esc=v=>String(v??'').replace(
  /[&<>'"]/g,
  c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    "'":'&#39;',
    '"':'&quot;'
  }[c])
);

const setting=(s,k)=>{
  const m=String(s||'').match(
    new RegExp('\\$'+k+'=\\{([^}]*)\\}','i')
  );
  return m?m[1].trim():'';
};

const closePanels=()=>{
  body.classList.remove('menu-on','search-on','share-on');
};

function buildMenu(menu){
  const links=all('a',menu);

  [1,2].forEach(level=>{
    let parent;

    links.forEach((link,i)=>{
      const label=link.textContent.trim();
      const next=links[i+1]?.textContent.trim();

      if(!label.startsWith('_')&&next?.startsWith('_')){
        parent=link.parentElement;

        const ul=document.createElement('ul');
        ul.className=`ul sub sm-${level}`;
        parent.append(ul);
      }

      if(label.startsWith('_')&&parent){
        link.textContent=label.replace(/^_+/,'');
        parent
          .querySelector(`.sm-${level}`)
          ?.append(link.parentElement);
      }
    });
  });

  all('.sub',menu).forEach(
    x=>x.parentElement.classList.add('has-sub')
  );

  menu.querySelector('.widget')?.classList.add('is-ready');
}

function lazyBackground(el){
  const src=el.dataset.src;

  if(!src||el.classList.contains('pbt-lazy')) return;

  const img=new Image();

  img.onload=()=>{
    el.style.backgroundImage=`url("${img.src}")`;
    el.classList.add('pbt-lazy');
  };

  img.src=src;
}

function observeBackgrounds(root=document){
  const items=all(
    '.thumbnail[data-src],.avatar[data-src]',
    root
  );

  if(!('IntersectionObserver' in window)){
    items.forEach(lazyBackground);
    return;
  }

  const io=new IntersectionObserver(
    entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          lazyBackground(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    {rootMargin:'240px'}
  );

  items.forEach(item=>io.observe(item));
}

function mapEntry(entry){
  return {
    title:entry.title?.$t||'',
    url:entry.link?.find(
      link=>link.rel==='alternate'
    )?.href||'',
    thumb:entry.media$thumbnail?.url||''
  };
}

function card(post){
  return `
    <article class="post">
      ${
        post.thumb
          ? `<a class="entry-thumbnail" href="${esc(post.url)}">
              <div class="thumbnail" data-src="${esc(post.thumb)}"></div>
            </a>`
          : ''
      }
      <div class="entry-header">
        <h2 class="entry-title">
          <a href="${esc(post.url)}">${esc(post.title)}</a>
        </h2>
      </div>
    </article>`;
}

async function feed(target,label,count){
  if(!target||target.dataset.loaded) return;

  target.dataset.loaded='1';

  const part=
    label&&label!=='recent'
      ? `/label/${encodeURIComponent(label)}`
      : '';

  try{
    const response=await fetch(
      `/feeds/posts/default${part}?alt=json&max-results=${count}`,
      {credentials:'same-origin'}
    );

    if(!response.ok) throw Error();

    const json=await response.json();
    const posts=(json.feed.entry||[]).map(mapEntry);

    target.innerHTML=
      posts.map(card).join('')||
      `<span class="error-msg">${
        esc(cfg.noResults||'No results found')
      }</span>`;

    observeBackgrounds(target);
  }catch{
    target.innerHTML=
      `<span class="error-msg">${
        esc(cfg.noResults||'No results found')
      }</span>`;
  }
}

function initFeeds(){
  all('.getPosts .widget-content').forEach(target=>{
    const code=target.dataset.shortcode;

    if(!code) return;

    const label=setting(code,'label')||'recent';
    const count=
      Number(setting(code,'results'))||
      (target.closest('.featured')?4:5);

    const run=()=>feed(target,label,count);

    if(!('IntersectionObserver' in window)){
      run();
      return;
    }

    const io=new IntersectionObserver(
      entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            run();
            io.disconnect();
          }
        });
      },
      {rootMargin:'300px'}
    );

    io.observe(target);
  });
}

function initSearch(){
  const input=one('.main-search input');
  const results=one('.search-results');

  if(!input||!results) return;

  let timer;
  let controller;

  input.addEventListener('input',()=>{
    clearTimeout(timer);
    controller?.abort();

    const query=input.value.trim();

    if(!query){
      results.textContent='';
      return;
    }

    timer=setTimeout(async()=>{
      controller=new AbortController();

      try{
        const response=await fetch(
          `/feeds/posts/default?alt=json&max-results=8&q=${
            encodeURIComponent(query)
          }`,
          {
            credentials:'same-origin',
            signal:controller.signal
          }
        );

        const json=await response.json();
        const posts=(json.feed.entry||[]).map(mapEntry);

        results.innerHTML=
          posts.map(post=>
            `<a href="${esc(post.url)}">${esc(post.title)}</a>`
          ).join('')||
          `<span class="error-msg">${
            esc(cfg.noResults||'No results found')
          }</span>`;
      }catch(error){
        if(error.name!=='AbortError'){
          results.textContent=
            cfg.noResults||'No results found';
        }
      }
    },300);
  });
}

function initMobile(){
  const source=one('.main-nav');
  const destination=one('.mobile-menu');

  if(source&&destination&&!destination.children.length){
    const nav=source.cloneNode(true);

    nav.className='mobile-nav';

    all('.ul',nav).forEach(
      list=>list.className='sub'
    );

    all('.type-mega .ul,.mega',nav).forEach(
      element=>element.remove()
    );

    destination.append(nav);

    all('.has-sub>a',destination).forEach(link=>{
      link.addEventListener('click',event=>{
        event.preventDefault();

        const item=link.parentElement;
        item.classList.toggle('expanded');

        const sub=one(':scope>.sub',item);

        if(sub){
          sub.hidden=!item.classList.contains('expanded');
        }
      });
    });
  }

  const logo=one('.main-logo a');
  const slot=one('.mobile-logo');

  if(logo&&slot&&!slot.children.length){
    const clone=logo.cloneNode(true);

    all('h1',clone).forEach(
      element=>element.remove()
    );

    slot.append(clone);
  }
}

function initHeader(){
  const header=one('.header-inner');

  if(!header||cfg.stickyMenu===false) return;

  let last=scrollY;
  let ticking=false;

  addEventListener(
    'scroll',
    ()=>{
      if(ticking) return;

      ticking=true;

      requestAnimationFrame(()=>{
        const current=scrollY;
        const fixed=current>header.offsetHeight*2;

        header.classList.toggle('is-fixed',fixed);
        header.classList.toggle(
          'show',
          fixed&&current<last
        );

        last=current;
        ticking=false;
      });
    },
    {passive:true}
  );
}

function initDarkMode(){
  const root=document.documentElement;
  const key='tbb_dark_mode';

  if(
    cfg.isDark===true||
    localStorage.getItem(key)==='true'
  ){
    root.classList.add('is-dark');
  }

  all('.darkmode-toggle').forEach(button=>{
    button.addEventListener('click',()=>{
      const enabled=root.classList.toggle('is-dark');

      localStorage.setItem(key,String(enabled));
      button.setAttribute(
        'aria-pressed',
        String(enabled)
      );
    });
  });
}

function initLoadMore(){
  const button=one('#load-more');

  if(!button) return;

  button.addEventListener('click',async event=>{
    event.preventDefault();

    const url=button.dataset.url;

    if(!url||button.dataset.busy) return;

    button.dataset.busy='1';
    button.setAttribute('aria-busy','true');

    try{
      const response=await fetch(
        url,
        {credentials:'same-origin'}
      );

      if(!response.ok) throw Error();

      const documentNext=new DOMParser().parseFromString(
        await response.text(),
        'text/html'
      );

      const incoming=one('.blog-posts',documentNext);
      const target=one('.blog-posts');
      const next=one('#load-more',documentNext);

      if(incoming&&target){
        [...incoming.children].forEach(element=>{
          target.append(
            document.importNode(element,true)
          );
        });

        observeBackgrounds(target);
      }

      if(next?.dataset.url){
        button.dataset.url=next.dataset.url;
      }else{
        button.remove();
      }
    }catch{
      button.removeAttribute('aria-busy');
    }finally{
      if(button.isConnected){
        delete button.dataset.busy;
        button.removeAttribute('aria-busy');
      }
    }
  });
}

function initCopy(){
  all('.copy-link').forEach(box=>{
    const input=one('input',box);
    const button=one('button',box);

    if(!input||!button) return;

    button.addEventListener('click',async()=>{
      try{
        await navigator.clipboard.writeText(input.value);

        box.classList.add('copied');

        setTimeout(
          ()=>box.classList.remove('copied'),
          2500
        );
      }catch{
        input.select();
      }
    });
  });
}

function initImages(){
  all('.post-body img').forEach((image,index)=>{
    if(!image.alt){
      image.alt=document.title
        .split(' | ')[0]
        .trim();
    }

    image.decoding='async';
    image.loading=index?'lazy':'eager';
    image.fetchPriority=index?'low':'high';

    if(
      !image.hasAttribute('width')&&
      !image.hasAttribute('height')
    ){
      image.width=1200;
      image.height=675;
    }
  });
}

function initTables(){
  all('.post-body table').forEach(table=>{
    if(
      !table.parentElement
        ?.classList
        .contains('table-responsive-wrapper')
    ){
      const wrapper=document.createElement('div');

      wrapper.className='table-responsive-wrapper';

      table.before(wrapper);
      wrapper.append(table);
    }
  });
}

function initVideo(){
  all('.video-youtube[data-src]').forEach(box=>{
    if(!('IntersectionObserver' in window)) return;

    const observer=new IntersectionObserver(
      entries=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting) return;

          const iframe=document.createElement('iframe');

          iframe.src='https:'+box.dataset.src;
          iframe.loading='lazy';
          iframe.title='YouTube video';
          iframe.allow=
            'accelerometer; autoplay; clipboard-write; '+
            'encrypted-media; gyroscope; picture-in-picture';
          iframe.allowFullscreen=true;

          box.replaceWith(iframe);
          observer.disconnect();
        });
      },
      {rootMargin:'200px'}
    );

    observer.observe(box);
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  all('.main-nav').forEach(buildMenu);

  initMobile();
  initHeader();
  initDarkMode();
  observeBackgrounds();
  initFeeds();
  initSearch();
  initImages();
  initTables();
  initVideo();
  initLoadMore();
  initCopy();

  all('.menu-toggle,.hide-mobile-menu').forEach(button=>{
    button.addEventListener('click',()=>{
      body.classList.toggle('menu-on');
    });
  });

  all('.overlay-bg').forEach(element=>{
    element.addEventListener('click',closePanels);
  });

  all('.search-toggle').forEach(button=>{
    button.addEventListener('click',()=>{
      body.classList.add('search-on');

      setTimeout(
        ()=>one('.main-search input')?.focus(),
        0
      );
    });
  });

  all('.main-search .close,.hide-modal').forEach(button=>{
    button.addEventListener('click',closePanels);
  });

  all(
    '.share-toggle,.post-share .show-more button'
  ).forEach(button=>{
    button.addEventListener('click',()=>{
      body.classList.add('share-on');
    });
  });

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      closePanels();
    }
  });

  all('.to-top').forEach(button=>{
    addEventListener(
      'scroll',
      ()=>{
        button.classList.toggle(
          'show',
          scrollY>=100
        );
      },
      {passive:true}
    );

    button.addEventListener('click',()=>{
      scrollTo({
        top:0,
        behavior:'smooth'
      });
    });
  });
});

})();
