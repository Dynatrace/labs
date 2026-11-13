/* The browser tab says where you are, including the open solution. */
function updateTitle(){
  const v=CURRENT_VIEW, base='Dynatrace Labs';
  const page=v==='explore'?($('#exploreTitle').textContent==='AI & Agents'?'AI & Agents':''):v==='about'?'About':v==='contribute'?'Contribute a solution':v==='maintainers'?'Maintainer overview':'';
  document.title=[v==='explore'&&CUR?CUR.title:'',page,base].filter(Boolean).join(' – ');
}
/* After a page change keyboard and screen-reader users start on the new page,
   not on the link they used: focus its heading, or the open solution. */
function focusView(){
  const t=CURRENT_VIEW==='explore'&&CUR?$('#dTitle'):$('#view-'+CURRENT_VIEW+' h1');
  if(t) t.focus({preventScroll:true});
}
function go(view,params={}){
  const qs=new URLSearchParams(params).toString();
  const hash='#/'+(view==='welcome'?'':view)+(qs?'?'+qs:'');
  if(location.hash===hash) route(); else location.hash=hash;
}
function route(){
  const m=location.hash.match(/^#\/([a-z]*)(?:\?(.*))?$/);
  let view=VIEWS.includes(m&&m[1])?m[1]:'welcome';
  if(view==='welcome') view='explore';   // preview: the home page is Explore
  const p=new URLSearchParams((m&&m[2])||'');
  const prevView=CURRENT_VIEW; CURRENT_VIEW=view;
  VIEWS.forEach(v=>$('#view-'+v).hidden=v!==view);
  $$('[data-go]').forEach(b=>b.toggleAttribute('aria-current',b.dataset.go===view&&view!=='welcome'));
  $$('[data-go][aria-current]').forEach(b=>b.setAttribute('aria-current','page'));
  if(view==='explore'){
    F.tech=new Set(p.getAll('tech')); F.area=new Set(p.getAll('area')); F.type=new Set(p.getAll('type'));
    F.id=p.get('id'); $('#q').value=p.get('q')||'';
    const sort=p.get('sort'); sortTouched=!!sort;
    $('#sortBy').value=[...$('#sortBy').options].some(o=>o.value===sort)?sort:DEFAULT_SORT;
    setSortForQuery();
    const sel=p.get('s'); if(!sel) closeDetail({fromRoute:true});
    PAGE=1; syncRail(); render();
    if(sel) ART.some(a=>a.id===sel)?openDetail(sel,{fromRoute:true}):closeDetail({fromRoute:true});
  } else closeDetail({fromRoute:true});
  if(view==='maintainers') renderMaintainers();
  updateNavState();
  setMenu(false);
  if(document.activeElement&&document.activeElement.closest('#freshStrip')) document.activeElement.blur();
  /* A filter or search in the address (AI & Agents, shared links) shows the results, not the hero. */
  if(view==='explore'&&!p.get('s')&&['area','tech','type','q','id'].some(k=>p.has(k))) $('#results').scrollIntoView({block:'start'});
  else window.scrollTo({top:0,behavior:'instant'});
  updateHeader();
  updateTitle();
  if(prevView&&prevView!==view) focusView();   // not on first load: the browser's starting point stays
  if(prevView!==view){
    track('page_view',{'view.name':view==='explore'&&$('#exploreTitle').textContent==='AI & Agents'?'ai_agents':view,
      'from.view':prevView||'none',
      'entry':prevView?'internal':p.get('s')?'shared_link':document.referrer?'referral':'direct'});
    if(view==='explore'&&p.get('q')){ lastSearch=''; trackSearch(); }
  }
}
window.addEventListener('hashchange',route);
/* "AI & Agents" is Explore with exactly the two AI categories selected. When that
   is what is on screen, the header link and the page title say so. */
const AI_AREAS=['Agentic Operations','AI Observability'];
function updateNavState(){
  const onExplore=!$('#view-explore').hidden;
  const isAI=onExplore && F.area.size===AI_AREAS.length && AI_AREAS.every(x=>F.area.has(x))
             && !F.tech.size && !F.type.size && !F.id;
  $('#navAI').toggleAttribute('aria-current',isAI); if(isAI) $('#navAI').setAttribute('aria-current','page');
  const ab=$('#navAbout'), onAbout=!$('#view-about').hidden;
  ab.toggleAttribute('aria-current',onAbout); if(onAbout) ab.setAttribute('aria-current','page');
  $('#exploreTitle').textContent=isAI?'AI & Agents':'All solutions';
  updateTitle();
}
/* "Browse all solutions" (About) scrolls to the results on the home page. */
const jumpToResults=()=>$('#results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
document.addEventListener('click',e=>{
  const j=e.target.closest('[data-jump]'); if(j){
    if($('#view-explore').hidden){ location.hash='#/'; setTimeout(jumpToResults,80); } else jumpToResults();
    return; }
  const g=e.target.closest('[data-go]'); if(g){ e.preventDefault(); go(g.dataset.go); return; }
  const o=e.target.closest('[data-open]'); if(o){
    OPEN_SOURCE={source:o.closest('#freshStrip')?'home_new':o.closest('#areaGrid')?'home_category':'other'};
    go('explore',{s:o.dataset.open}); return; }
  const ar=e.target.closest('[data-area]'); if(ar){
    track('filter',{facet:'area',value:ar.dataset.area,action:'add',source:'home'});
    go('explore',{area:ar.dataset.area}); return; }
  /* data-explore holds a query string, so a filter can repeat (area=…&area=…). */
  const ex=e.target.closest('[data-explore]'); if(ex){
    track('filter',{facet:'preset',value:ex.textContent.trim(),action:'add',source:'nav'});
    const h='#/explore?'+new URLSearchParams(ex.dataset.explore);
    if(location.hash===h) route(); else location.hash=h; return;
  }
});

function updateHeader(){
  const overHero=!$('#view-explore').hidden && window.scrollY<40 && !$('#mnav').classList.contains('open');
  $('#hdr').classList.toggle('solid',!overHero);
}
window.addEventListener('scroll',updateHeader,{passive:true});

/* Links that leave the page: GitHub folders and READMEs, issues, the contribution guide. */
document.addEventListener('click',e=>{
  const l=e.target.closest('a[href]'); if(!l||!/^https?:/.test(l.href)||l.href.startsWith(location.origin)) return;
  const T={dRepo:'solution_github',dReadme:'solution_readme',guideLink:'contribute_guide',contribGuide:'contribute_guide',
           contribRepo:'contribute_repo',repoLink:'contribute_repo',contribTemplate:'contribute_template'};
  const inPanel=!!(CUR&&l.closest('#drawer'));
  track('outbound',{target:T[l.id]||(l.href.includes('/issues/new')?'open_issue':inPanel?'solution_link':l.closest('footer')?'footer':'other'),
    'link.host':new URL(l.href).host,...(inPanel?solAttrs(CUR):{})});
});

/* Skip link: the hash is the router's, so move focus by hand. */
$('#skipLink').addEventListener('click',e=>{ e.preventDefault(); const h=$('#view-'+(CURRENT_VIEW||'welcome')+' h1'); if(h) h.focus(); });

/* Phone menu */
function setMenu(open){
  $('#mnav').classList.toggle('open',open); $('#menuBtn').setAttribute('aria-expanded',String(open)); updateHeader();
}
$('#menuBtn').addEventListener('click',e=>{ e.stopPropagation(); setMenu(!$('#mnav').classList.contains('open')); });
document.addEventListener('click',e=>{ if(!e.target.closest('#mnav,#menuBtn')) setMenu(false); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') setMenu(false); });

/* Theme */
$('#themeBtn').addEventListener('click',()=>{
  const r=document.documentElement, t=r.getAttribute('data-theme')==='dark'?'light':'dark';
  r.setAttribute('data-theme',t); try{localStorage.setItem('dtDevCommunity.theme',t);}catch(e){}
});
