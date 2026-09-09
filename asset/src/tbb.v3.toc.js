/* TBB v3 TOC renderer — restores {getToc} shortcode. Zero jQuery. */
(() => {
  'use strict';
  const one=(s,r=document)=>r.querySelector(s);
  const all=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const setting=(text,key)=>String(text||'').match(new RegExp('\\$'+key+'=\\{([^}]*)\\}','i'))?.[1].trim()||'';
  const slugify=(text)=>String(text||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\u00C0-\u024f\u0600-\u06ff]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,80)||'section';

  function build(post){
    if(!post||post.dataset.tbbToc==='1')return;
    const marker=all('p,div,span',post).find(el=>el.childElementCount===0&&el.textContent.includes('{getToc}'));
    if(!marker)return;
    const headings=all('h2,h3,h4',post).filter(h=>!h.closest('.tbb-toc'));
    if(!headings.length){marker.remove();post.dataset.tbbToc='1';return;}

    const used=new Set();
    const details=document.createElement('details');
    details.className='tbb-toc';
    const expanded=setting(marker.textContent,'expanded').toLowerCase();
    details.open=expanded==='true'||expanded==='1'||expanded==='yes';

    const summary=document.createElement('summary');
    summary.textContent=setting(marker.textContent,'title')||'Isi Kandungan';
    const list=document.createElement('ol');
    list.className='tbb-toc-list';

    headings.forEach((heading,index)=>{
      let id=heading.id||slugify(heading.textContent);
      let base=id,n=2;
      while(used.has(id)||(!heading.id&&document.getElementById(id))){id=base+'-'+n++;}
      used.add(id); heading.id=id;

      const li=document.createElement('li');
      li.className='toc-'+heading.tagName.toLowerCase();
      const a=document.createElement('a');
      a.href='#'+encodeURIComponent(id);
      a.textContent=heading.textContent.trim()||('Seksyen '+(index+1));
      a.addEventListener('click',()=>{ if(!details.open) details.open=true; });
      li.append(a); list.append(li);
    });

    details.append(summary,list);
    marker.replaceWith(details);
    post.dataset.tbbToc='1';
  }

  function start(){all('.post-body').forEach(build);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
