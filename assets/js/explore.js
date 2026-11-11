/* ═══════════════════════════════════════════════════════════════════════════
   EXPLORE
   ═══════════════════════════════════════════════════════════════════════════ */
const F={tech:new Set(),area:new Set(),type:new Set(),id:null};
let PAGE=1, techAll=false; const PAGE_SIZE=24, TECH_SHOWN=8;
const DEFAULT_SORT='added';
const TECH_COUNT={}; ART.forEach(a=>a.tech.forEach(t=>TECH_COUNT[t]=(TECH_COUNT[t]||0)+1));
const TECHS=Object.keys(TECH_COUNT).sort((x,y)=>TECH_COUNT[y]-TECH_COUNT[x]||x.localeCompare(y));
const DIM={tech:a=>a.tech, area:a=>a.areas, type:a=>typesOf(a)};

function matches(a,skip){
  if(F.id && a.id!==F.id) return false;
  for(const d of ['tech','area','type'])
    if(skip!==d && F[d].size && !DIM[d](a).some(x=>F[d].has(x))) return false;
  return true;
}
function results(){
  const q=$('#q').value.trim(), terms=queryTerms(q), qn=norm(q);
  const list=ART.filter(a=>matches(a)).map(a=>({a,s:scoreOf(a,terms,qn)})).filter(x=>x.s>0);
  const S={relevance:(x,y)=>y.s-x.s||byPopular(x.a,y.a),added:(x,y)=>byAdded(x.a,y.a),popular:(x,y)=>byPopular(x.a,y.a),
           updated:(x,y)=>byUpdated(x.a,y.a),name:(x,y)=>x.a.title.localeCompare(y.a.title)};
  return list.sort(S[$('#sortBy').value]||S.popular).map(x=>x.a);
}
function syncRail(){
  const q=$('#q').value.trim(), terms=queryTerms(q), qn=norm(q);
  const pool=ART.filter(a=>scoreOf(a,terms,qn)>0);
  const opt=(dim,val,label)=>{
    const n=pool.filter(a=>matches(a,dim)&&DIM[dim](a).includes(val)).length;
    return `<label class="opt ${n?'':'off'}"><input type="checkbox" data-dim="${dim}" value="${esc(val)}" ${F[dim].has(val)?'checked':''}>
      <span class="nm">${esc(label)}</span><span class="ct">${n}</span></label>`;
  };
  /* Selected technologies always stay visible, even beyond the first eight. */
  /* Collapsed: the most used technologies; searching: every match; either way A–Z.
     Selected technologies always stay visible. */
  const tq=norm($('#techSearch').value.trim());
  const shownTech=(tq?TECHS.filter(t=>norm(t).includes(tq)||F.tech.has(t))
    :techAll?TECHS:TECHS.filter((t,i)=>i<TECH_SHOWN||F.tech.has(t))).slice().sort((x,y)=>x.localeCompare(y));
  $('#fTech').innerHTML=shownTech.map(t=>opt('tech',t,t)).join('');
  $('#techMore').hidden=TECHS.length<=TECH_SHOWN||!!tq;
  if(tq&&!shownTech.length) $('#fTech').innerHTML='<p class="fnone">No technology matches.</p>';
  $('#techMore').textContent=techAll?'Show fewer':`Show all ${TECHS.length}`;
  $('#fArea').innerHTML=[...AREAS].sort((x,y)=>x.localeCompare(y)).map(x=>opt('area',x,x)).join('');
  $('#fType').innerHTML=C.types.filter(t=>ART.some(a=>typesOf(a).includes(t.id))).sort((x,y)=>x.label.localeCompare(y.label)).map(t=>opt('type',t.id,t.label)).join('');
}
$('#techMore').addEventListener('click',()=>{techAll=!techAll; syncRail();});
$('#techSearch').addEventListener('input',syncRail);
$('.rail').addEventListener('change',e=>{
  const i=e.target; if(!i.dataset.dim) return;
  F[i.dataset.dim][i.checked?'add':'delete'](i.value); PAGE=1; refresh();
  track('filter',{facet:i.dataset.dim,value:i.value,action:i.checked?'add':'remove',source:'filters','search.results':results().length});
});
/* The URL always describes what is on screen — filters, search, sort and the
   open solution — so any state can be shared. replaceState: no history entry per click. */
function exploreParams(){
  const p=new URLSearchParams();
  F.tech.forEach(x=>p.append('tech',x)); F.area.forEach(x=>p.append('area',x)); F.type.forEach(x=>p.append('type',x));
  if(F.id) p.set('id',F.id); const q=$('#q').value.trim(); if(q) p.set('q',q);
  const sort=$('#sortBy').value; if(sort!==DEFAULT_SORT && !(q&&sort==='relevance')) p.set('sort',sort);
  if(CUR) p.set('s',CUR.id);
  return p;
}
function syncHash(){
  if($('#view-explore').hidden) return;
  const qs=exploreParams().toString(); history.replaceState(null,'','#/explore'+(qs?'?'+qs:''));
}
function refresh(){ syncRail(); render(); syncHash(); updateNavState(); }
function resetAll(){ $('#techSearch').value=''; F.tech.clear(); F.area.clear(); F.type.clear(); F.id=null; $('#q').value=''; setSortForQuery(); PAGE=1; refresh(); }
$('#resetF').addEventListener('click',resetAll);
$('#emptyReset').addEventListener('click',resetAll);
/* Typing switches to "Best match"; clearing the search goes back to the default. */
let sortTouched=false;
function setSortForQuery(){
  const has=!!$('#q').value.trim(), sel=$('#sortBy'), rel=sel.querySelector('[value="relevance"]');
  rel.hidden=!has; rel.disabled=!has;
  if(has && !sortTouched) sel.value='relevance';
  if(!has && sel.value==='relevance'){ sel.value=DEFAULT_SORT; sortTouched=false; }
}
$('#q').addEventListener('input',()=>{ setSortForQuery(); PAGE=1; refresh();
  clearTimeout(searchTimer); searchTimer=setTimeout(trackSearch,1500); });
$('#q').addEventListener('change',trackSearch);
$('#q').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); trackSearch(); jumpToResults(); } });
/* A tap or click must not focus the box (that opens the phone keyboard). A keyboard user (click detail 0)
   would lose focus when the button disappears, so for them focus goes back to the box. */
$('#qClear').addEventListener('click',e=>{ const q=$('#q'); q.value=''; q.dispatchEvent(new Event('input')); if(e.detail===0) q.focus(); });   // Enter or leaving the box
$('#sortBy').addEventListener('change',()=>{ sortTouched=true; PAGE=1; refresh(); });

function render(){
  const list=results(), q=$('#q').value.trim();
  { const h=$('#view-explore .hero'), was=h.classList.contains('searching');
    h.classList.toggle('searching',!!q);
    if(was!==!!q) h.classList.toggle('unsearched',was);   // fade the description and carousel back in once
  }
  /* Folded-away parts leave the tab order and the screen-reader view. */
  $('.hero-fresh').inert=!!q; $('#view-explore .hero-sub').inert=!!q;
  $('#qClear').hidden=!q;
  const pages=Math.max(1,Math.ceil(list.length/PAGE_SIZE)); if(PAGE>pages) PAGE=pages;
  const slice=list.slice((PAGE-1)*PAGE_SIZE,PAGE*PAGE_SIZE);

  const chips=[];
  if(F.id){ const a=ART.find(x=>x.id===F.id); chips.push(`<button class="af" data-clear="id">Solution: ${esc(a?a.title:F.id)} <span class="x">✕</span></button>`); }
  F.tech.forEach(x=>chips.push(`<button class="af" data-clear="tech" data-v="${esc(x)}">${esc(x)} <span class="x">✕</span></button>`));
  F.area.forEach(x=>chips.push(`<button class="af" data-clear="area" data-v="${esc(x)}">${esc(x)} <span class="x">✕</span></button>`));
  F.type.forEach(x=>chips.push(`<button class="af" data-clear="type" data-v="${esc(x)}">${esc(TYPE[x].label)} <span class="x">✕</span></button>`));
  $('#activeF').innerHTML=chips.join('');

  const nF=F.tech.size+F.area.size+F.type.size;
  $('#filterCount').textContent=nF?`(${nF})`:'';
  $('#railDone').textContent=`Show ${list.length} solution${list.length===1?'':'s'}`;
  $('#resCount').textContent=`${list.length} of ${ART.length} solutions`+(q?` for “${q}”`:'');
  $('#empty').hidden=list.length>0;
  $('#emptyTech').innerHTML=TECHS.slice(0,6).map(t=>`<button class="af" data-try-tech="${esc(t)}">${esc(t)}</button>`).join('');
  $('#cards').innerHTML=slice.map(a=>{
    const isNew=daysAgo(a.added)<30;
    return `<article class="acard${CUR&&CUR.id===a.id?' selected':''}" data-id="${esc(a.id)}">
      <div class="thumb">${preview(a)}<div class="badges">${isNew?'<span class="chip new">New</span>':''}</div></div>
      <div class="body">
        <div class="tags"><span class="tag type">${esc(TYPE[a.type].label)}</span>${(a.tech[0]?[a.tech[0]]:a.areas.slice(0,1)).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div>
        <h3><button class="acard-open" type="button">${highlight(esc(a.title),q)}</button></h3>
        <p class="desc">${highlight(esc(a.summary),q)}</p>
      </div></article>`;
  }).join('');
  $('#pager').innerHTML=pages>1?[`<button class="pg" data-page="${PAGE-1}" ${PAGE===1?'disabled':''}>‹</button>`,
    ...Array.from({length:pages},(_,i)=>`<button class="pg ${i+1===PAGE?'on':''}" data-page="${i+1}">${i+1}</button>`),
    `<button class="pg" data-page="${PAGE+1}" ${PAGE===pages?'disabled':''}>›</button>`].join(''):'';
}
$('#activeF').addEventListener('click',e=>{
  const b=e.target.closest('[data-clear]'); if(!b) return;
  if(b.dataset.clear==='id') F.id=null; else F[b.dataset.clear].delete(b.dataset.v);
  track('filter',{facet:b.dataset.clear,value:b.dataset.v||'',action:'remove',source:'chip'});
  PAGE=1; refresh();
});
$('#emptyTech').addEventListener('click',e=>{
  const b=e.target.closest('[data-try-tech]'); if(!b) return;
  F.tech.clear(); F.area.clear(); F.type.clear(); F.id=null; $('#q').value=''; setSortForQuery();
  F.tech.add(b.dataset.tryTech); PAGE=1; refresh();
  track('filter',{facet:'tech',value:b.dataset.tryTech,action:'add',source:'empty_state'});
});
$('#pager').addEventListener('click',e=>{const b=e.target.closest('[data-page]'); if(!b||b.disabled) return;
  PAGE=+b.dataset.page; render(); window.scrollTo({top:0,behavior:'smooth'});});
$('#cards').addEventListener('click',e=>{const c=e.target.closest('.acard'); if(!c) return;
  const q=normQuery($('#q').value);
  OPEN_SOURCE={source:'explore_list','list.position':results().findIndex(a=>a.id===c.dataset.id)+1,...(q?{'search.query':q}:{})};
  openDetail(c.dataset.id);});

/* ═══════════════════════════════════════════════════════════════════════════
   HERO SEARCH SUGGESTIONS — matching technologies / categories / types as
   one-click filters, then the best-matching solutions.
   ═══════════════════════════════════════════════════════════════════════════ */
let sgIdx=-1;
function suggestions(q){
  const qn=norm(q).trim(); if(qn.length<2) return [];
  const facet=(kind,label,val,param)=>({kind,label,go:{[param]:val}});
  const hits=[
    ...TECHS.filter(t=>norm(t).includes(qn)).map(t=>facet('Technology',t,t,'tech')),
    ...AREAS.filter(x=>norm(x).includes(qn)).map(x=>facet('Category',x,x,'area')),
    ...C.types.filter(t=>norm(t.label).includes(qn)&&ART.some(a=>typesOf(a).includes(t.id))).map(t=>facet('Type',t.label,t.id,'type')),
  ].slice(0,3);
  const terms=queryTerms(q);
  const sols=ART.map(a=>({a,s:scoreOf(a,terms,qn)})).filter(x=>x.s>0).sort((x,y)=>y.s-x.s||byPopular(x.a,y.a)).slice(0,5)
    .map(({a})=>({kind:'solution',a,go:{s:a.id}}));
  return [...hits,...sols,{kind:'all',label:`See all results for “${q}”`,go:{q}}];
}
function renderSuggest(){
  const q=$('#heroQ').value, box=$('#heroSuggest'), items=suggestions(q);
  if(!items.length){ box.hidden=true; return; }
  sgIdx=-1; box._items=items;
  box.innerHTML=items.map((it,i)=>it.kind==='solution'
    ?`<button type="button" class="sg" data-sg="${i}" role="option"><span class="mini">${preview(it.a)}</span>
        <span class="sgt">${highlight(esc(it.a.title),q)}<span class="sgm"> · ${esc(TYPE[it.a.type].label)}</span></span></button>`
    :it.kind==='all'
    ?`<button type="button" class="sg sg-all" data-sg="${i}" role="option">${esc(it.label)} →</button>`
    :`<button type="button" class="sg" data-sg="${i}" role="option"><span class="k">${esc(it.kind)}</span><span class="sgt">${highlight(esc(it.label),q)}</span></button>`
  ).join('');
  box.hidden=false;
}
function pickSuggest(i){
  const it=$('#heroSuggest')._items[i], q=normQuery($('#heroQ').value); $('#heroSuggest').hidden=true;
  if(it.kind==='solution') OPEN_SOURCE={source:'hero_suggestion','search.query':q};
  else if(it.kind==='all') SEARCH_SOURCE='hero';
  else { const [facet,value]=Object.entries(it.go)[0]; track('filter',{facet,value,action:'add',source:'hero_suggestion','search.query':q}); }
  go('explore',it.go);
}
$('#heroQ').addEventListener('input',renderSuggest);
$('#heroQ').addEventListener('focus',renderSuggest);
$('#heroQ').addEventListener('keydown',e=>{
  const box=$('#heroSuggest'); if(box.hidden) return;
  const n=box._items.length;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    e.preventDefault(); sgIdx=(sgIdx+(e.key==='ArrowDown'?1:-1)+n)%n;
    $$('#heroSuggest .sg').forEach((b,i)=>b.classList.toggle('on',i===sgIdx));
  } else if(e.key==='Enter' && sgIdx>=0){ e.preventDefault(); pickSuggest(sgIdx); }
  else if(e.key==='Escape'){ box.hidden=true; }
});
/* Screen readers learn whether the suggestion list is open, whichever code path opens or closes it. */
new MutationObserver(()=>$('#heroQ').setAttribute('aria-expanded',String(!$('#heroSuggest').hidden)))
  .observe($('#heroSuggest'),{attributes:true,attributeFilter:['hidden']});
$('#heroSuggest').addEventListener('mousedown',e=>e.preventDefault());   // keep focus in the input
$('#heroSuggest').addEventListener('click',e=>{ const b=e.target.closest('[data-sg]'); if(b) pickSuggest(+b.dataset.sg); });
document.addEventListener('click',e=>{ if(!e.target.closest('#heroForm')) $('#heroSuggest').hidden=true; });
$('#heroForm').addEventListener('submit',e=>{
  e.preventDefault(); $('#heroSuggest').hidden=true;
  const q=$('#heroQ').value.trim(); if(q) SEARCH_SOURCE='hero'; go('explore',q?{q}:{});
});
