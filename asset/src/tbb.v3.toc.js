/* TBB v3.1 TOC renderer — robust Blogger {getToc} shortcode support. Zero jQuery. */
(() => {
  'use strict';
  const all=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const setting=(text,key)=>String(text||'').match(new RegExp('\\$'+key+'=\\{([^}]*)\\}','i'))?.[1].trim()||'';
  const slugify=(text)=>String(text||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\u00C0-\u024f\u0600-\u06ff]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,80)||'section';
  const SHORTCODE=/\{getToc\}(?:\s+\$[a-zA-Z]+\s*=\s*\{[^}]*\})*/i;

  function findMarker(post){
    const walker=document.createTreeWalker(post,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const p=node.parentElement;
      if(!p||p.closest('script,style,noscript,.tbb-toc'))return NodeFilter.FILTER_REJECT;
      return /\{getToc\}/i.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;
    }});
    const node=walker.nextNode();
    if(node){
      const match=(node.nodeValue||'').match(SHORTCODE);
      if(match)return {node,text:match[0]};
    }
    const el=all('p,div,span',post).find(el=>!el.closest('.tbb-toc')&&/\{getToc\}/i.test(el.textContent||''));
    if(el){const match=(el.textContent||'').match(SHORTCODE);if(match)return {element:el,text:match[0]};}
    return null;
  }

  function replaceMarker(marker,replacement){
    if(marker.node){
      const text=marker.node.nodeValue||'';
      const i=text.indexOf(marker.text);
      if(i<0)return false;
      const before=text.slice(0,i),after=text.slice(i+marker.text.length);
      const frag=document.createDocumentFragment();
      if(before)frag.append(document.createTextNode(before));
      frag.append(replacement);
      if(after)frag.append(document.createTextNode(after));
      marker.node.parentNode.replaceChild(frag,marker.node);
      return true;
    }
    if(marker.element){
      if(marker.element.textContent.trim()===marker.text.trim()){marker.element.replaceWith(replacement);return true;}
      const html=marker.element.innerHTML;
      marker.element.innerHTML=html.replace(marker.text,'');
      marker.element.before(replacement);
      return true;
    }
    return false;
  }

  function build(post){
    if(!post||post.dataset.tbbToc==='1')return;
    const marker=findMarker(post);
    if(!marker)return;
    const headings=all('h2,h3,h4',post).filter(h=>!h.closest('.tbb-toc')&&h.textContent.trim());
    if(!headings.length){
      if(marker.node) marker.node.nodeValue=(marker.node.nodeValue||'').replace(marker.text,'');
      else marker.element?.remove();
      post.dataset.tbbToc='1';
      return;
    }

    const details=document.createElement('details');
    details.className='tbb-toc';
    const expanded=setting(marker.text,'expanded').toLowerCase();
    details.open=['true','1','yes','expanded'].includes(expanded);

    const summary=document.createElement('summary');
    summary.textContent=setting(marker.text,'title')||'Isi Kandungan';
    const list=document.createElement('ol');
    list.className='tbb-toc-list';
    const used=new Set();

    headings.forEach((heading,index)=>{
      let id=heading.id||slugify(heading.textContent);
      const base=id;let n=2;
      while(used.has(id)||(!heading.id&&document.getElementById(id)))id=base+'-'+n++;
      used.add(id);heading.id=id;
      const li=document.createElement('li');
      li.className='toc-'+heading.tagName.toLowerCase();
      const a=document.createElement('a');
      a.href='#'+id;
      a.textContent=heading.textContent.trim()||('Seksyen '+(index+1));
      li.append(a);list.append(li);
    });

    details.append(summary,list);
    if(replaceMarker(marker,details))post.dataset.tbbToc='1';
  }

  function start(){all('.post-body').forEach(build);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
