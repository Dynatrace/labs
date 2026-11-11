/* ═══════════════════════════════════════════════════════════════════════════
   FRESH OUT OF THE KITCHEN — the 8 most recently added solutions, screenshots
   first, in pages of 4 (2 on tablets, 1 on phones). Dots below switch pages;
   it also moves on by itself every few seconds unless someone is looking at it.
   ═══════════════════════════════════════════════════════════════════════════ */
/* Popularity = unique visitors from GitHub's traffic data (see
   fetch_community_popularity.py) — GitHub has no per-folder stars or downloads. */
const byPopular=(x,y)=>y.popularity.score-x.popularity.score||y.popularity.visitors14d-x.popularity.visitors14d||byUpdated(x,y);
const FRESH=[...ART.filter(a=>a.images.length).sort(byAdded),...ART.filter(a=>!a.images.length).sort(byAdded)].slice(0,10);
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const FRESH_AUTO_MS=8000;

function stripCard(a,hidden){
  return `<button class="mcard" data-open="${esc(a.id)}" ${hidden?'tabindex="-1" aria-hidden="true"':''} title="${esc(a.oneLiner||a.title)}">
    <span class="th">${ph(a)}</span>
    <span class="tx"><span class="tt">${esc(a.title)}</span><span class="ds">${esc(a.oneLiner)}</span></span></button>`;
}
const FP={page:0,pages:0,per:0,timer:null,hold:false,paused:false};
function freshDotLabel(i,per){
  const a=i*per+1, b=Math.min((i+1)*per,FRESH.length);
  return a===b?`Show new solution ${a}`:`Show new solutions ${a} to ${b}`;
}
const freshPerPage=()=>innerWidth<640?2:
  Math.min(5,Math.max(2,Math.floor((Math.min(innerWidth,1360)-(innerWidth<=720?32:64)+16)/234)));
function buildStrips(){
  const el=$('#freshStrip');
  if(!FRESH.length){ el.closest('.hero-fresh').hidden=true; return; }
  const per=freshPerPage(), pages=[];
  for(let i=0;i<FRESH.length;i+=per) pages.push(FRESH.slice(i,i+per));
  Object.assign(FP,{per,pages:pages.length,page:Math.min(FP.page,pages.length-1)});
  el.innerHTML=`<div class="ftrack">${pages.map(p=>
    `<div class="fpage" style="grid-template-columns:repeat(${per},${innerWidth<640?'minmax(0,1fr)':'218px'})">${p.map(a=>stripCard(a,false)).join('')}</div>`).join('')}</div>`;
  $('#freshDots').innerHTML=pages.length>1?pages.map((_,i)=>
    `<button type="button" class="fdot" data-page="${i}" aria-label="${freshDotLabel(i,per)}"></button>`).join(''):'';
  showFreshPage(FP.page,false);
  restartFreshTimer();
}
function showFreshPage(i,animate=true){
  if(!FP.pages) return;
  FP.page=(i+FP.pages)%FP.pages;
  const t=$('#freshStrip .ftrack');
  t.style.transition=animate&&!reduceMotion?'transform .7s cubic-bezier(.45,0,.2,1)':'none';
  t.style.transform=`translateX(calc(${-FP.page} * (100% + 48px)))`;   // sets are 48px apart
  /* Only the visible page is reachable by keyboard and screen readers. */
  $$('#freshStrip .fpage').forEach((p,pi)=>{
    p.toggleAttribute('inert',pi!==FP.page);
  });
  $$('#freshDots .fdot').forEach((d,di)=>{ d.classList.toggle('on',di===FP.page); d.setAttribute('aria-current',String(di===FP.page)); });
}
function restartFreshTimer(){
  clearInterval(FP.timer);
  $('#freshPause').hidden=reduceMotion||FP.pages<2;
  if(reduceMotion||FP.pages<2) return;
  FP.timer=setInterval(()=>{ if(!FP.hold&&!FP.paused&&!document.hidden&&!$('#view-explore').hidden) showFreshPage(FP.page+1); },FRESH_AUTO_MS);
}
/* Anything that moves by itself can be stopped (WCAG 2.2.2) — also on touch screens,
   where hovering doesn't exist. The visible word is part of the name (2.5.3). */
function paintFreshPause(){
  const b=$('#freshPause'), p=FP.paused;
  b.setAttribute('aria-label',p?'Play automatic scrolling':'Pause automatic scrolling');
  b.innerHTML=p?'<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z"/></svg>'
               :'<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1h3v10H2zM7 1h3v10H7z"/></svg>'; b.title=b.getAttribute('aria-label');
}
$('#freshPause').addEventListener('click',()=>{ FP.paused=!FP.paused; paintFreshPause(); });
paintFreshPause();
$('#freshDots').addEventListener('click',e=>{
  const d=e.target.closest('[data-page]'); if(!d) return;
  showFreshPage(+d.dataset.page); restartFreshTimer();   // a full interval before it moves on again
});
/* Don't move the cards away while someone is reading or using them. */
{
  const box=$('.hero-fresh');
  box.addEventListener('mouseenter',()=>FP.hold=true);
  box.addEventListener('mouseleave',()=>FP.hold=false);
  box.addEventListener('focusin',()=>FP.hold=true);
  box.addEventListener('focusout',()=>FP.hold=false);
}
let rsz, lastW=innerWidth;
window.addEventListener('resize',()=>{clearTimeout(rsz);rsz=setTimeout(()=>{ if(innerWidth!==lastW){ lastW=innerWidth; if(freshPerPage()!==FP.per) buildStrips(); } },200);});

/* ═══════════════════════════════════════════════════════════════════════════
   ALL SOLUTIONS — four featured categories with two examples each, plus "And more"
   ═══════════════════════════════════════════════════════════════════════════ */
const BIG_ICONS={
  agent:'<rect x="4" y="8" width="16" height="11" rx="2.5"/><path class="antenna" d="M12 4.6V8"/><circle class="antenna" cx="12" cy="3.4" r="1.1"/><circle class="eye" cx="9" cy="12.6" r="1.1" fill="#fff"/><circle class="eye" cx="15" cy="12.6" r="1.1" fill="#fff"/><path d="M9.8 16h4.4"/>',
  ai:'<circle cx="12" cy="12" r="3.2"/><g class="orbit"><ellipse cx="12" cy="12" rx="9" ry="3.6"/><circle cx="21" cy="12" r="1.2" fill="#fff"/></g><path d="M12 2.5v2M12 19.5v2"/>',
  dev:'<path d="M8 7l-5 5 5 5"/><path d="M16 7l5 5-5 5"/><path class="caret" d="M12 8v8"/>',
  more:'<rect class="tile" x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect class="tile" x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect class="tile" x="13.5" y="13.5" width="7" height="7" rx="1.6"/><rect class="tile" x="3.5" y="13.5" width="7" height="7" rx="1.6"/>',
};
/* Small line icons for the "And more" list, in the spirit of dynatrace.com's solution menu. */
const AREA_ICONS={
  'Application Observability':'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  'Application Security':'<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/><path d="M9 12l2 2 4-4"/>',
  'Business Observability':'<path d="M3 17l5.5-5.5 4 4L21 7"/><path d="M15 7h6v6"/>',
  'Cost Intelligence':'<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2.1 0 2.9 5.8 1.4 5.8 4.3 0 1.3-1.3 2.1-3 2.1-1.3 0-2.4-.5-2.9-1.5M12 6.2v1.6M12 16.3v1.5"/>',
  'Digital Experience':'<path d="M5 3l14 7-6 1.5L10.5 18z"/>',
  'Infrastructure Observability':'<path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 18z"/>',
  'Kubernetes':'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/><path d="M12 3.5v6.3M12 14.2v6.3M3.9 9.4l6 1.9M14.1 12.7l6 1.9M6.6 18.6l3.8-4.9M13.6 10.3l3.8-4.9"/>',
  'Logs':'<path d="M4 6h16M4 10h12M4 14h16M4 18h9"/>',
  'Administration & Governance':'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  'Software Delivery':'<path d="M7.5 9a3 3 0 1 0 0 6c2.5 0 6.5-6 9-6a3 3 0 1 1 0 6c-2.5 0-6.5-6-9-6z"/>',
};
const areaIcon=x=>`<svg class="mi" viewBox="0 0 24 24" aria-hidden="true">${AREA_ICONS[x]||'<circle cx="12" cy="12" r="4"/>'}</svg>`;
function renderAreas(){
  const used=new Set();
  const cards=FEATURED.map(f=>{
    const pool=ART.filter(a=>a.areas.includes(f.area));
    /* Solutions with a real screenshot come first. If a category has fewer than two,
       the remaining slots are filled with related solutions without one (placeholder). */
    const shots=pool.filter(a=>a.images.length), noShots=pool.filter(a=>!a.images.length);
    const pick=[...shots.filter(a=>!used.has(a.id)).sort(byUpdated),
                ...shots.filter(a=>used.has(a.id)).sort(byUpdated),
                ...noShots.filter(a=>!used.has(a.id)).sort(byUpdated),
                ...noShots.filter(a=>used.has(a.id)).sort(byUpdated)].slice(0,2);
    pick.forEach(a=>used.add(a.id));
    return `<article class="acat">
      <div class="acat-hd"><span class="bigic ${f.g}"><svg viewBox="0 0 24 24">${BIG_ICONS[f.icon]}</svg></span>
        <h3 class="acat-nm">${esc(f.label)}</h3></div>
      ${pick.map(a=>`<button class="ex" data-open="${esc(a.id)}">
        <span class="th">${preview(a)}</span>
        <span class="tt">${esc(a.title)}</span>
        <span class="ds">${esc(a.oneLiner)}</span></button>`).join('')}
      <button class="btn btn-primary browse-all" data-area="${esc(f.area)}">View all</button>
    </article>`;
  });
  const rest=AREAS.filter(x=>!FEATURED.some(f=>f.area===x)).sort();
  cards.push(`<article class="acat">
    <div class="acat-hd"><span class="bigic g-more"><svg viewBox="0 0 24 24">${BIG_ICONS.more}</svg></span>
      <h3 class="acat-nm">And more</h3></div>
    <ul class="more-list">${rest.map(x=>`<li><button data-area="${esc(x)}">${areaIcon(x)}${esc(x)}</button></li>`).join('')}</ul>
    <button class="btn btn-primary browse-all" data-go="explore">Browse all solutions</button>
  </article>`);
  $('#areaGrid').innerHTML=cards.join('');
}
