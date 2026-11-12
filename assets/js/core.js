/* ═══════════════════════════════════════════════════════════════════════════
   DATA — everything comes from catalog-repo.js, generated from
   Dynatrace/community-examples by the catalog build (scripts/build_catalog.py).
   Nothing on this page is curated by hand.
   ═══════════════════════════════════════════════════════════════════════════ */
const C = window.CATALOG_REPO || {entries:[],types:[],areas:[],repo:'https://github.com/Dynatrace/community-examples'};
const ART = C.entries;
const TYPE = Object.fromEntries(C.types.map(t=>[t.id,t]));
const AREA_COUNT = {};
ART.forEach(a=>a.areas.forEach(x=>AREA_COUNT[x]=(AREA_COUNT[x]||0)+1));
/* "Other" (no category) is never offered as a filter. */
const AREAS = C.areas.filter(x=>AREA_COUNT[x]&&x!=='Other');

/* Home-page category cards. The last one ("And more") lists every other area. */
const FEATURED = [
  {area:'Agentic Operations', label:'Agentic Operations', g:'g-agent', icon:'agent'},
  {area:'AI Observability',   label:'AI Observability',   g:'g-ai',    icon:'ai'},
  {area:'Developer',          label:'Developer',          g:'g-dev',   icon:'dev'},
];

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtDate=d=>d?new Date(d+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—';
const daysAgo=d=>(Date.now()-new Date(d+'T00:00:00'))/864e5;
function relDate(d){ if(!d) return '—'; const n=Math.round(daysAgo(d));
  return n<1?'today':n<2?'yesterday':n<30?`${n} days ago`:n<365?`${Math.round(n/30.4)} months ago`:`${(n/365).toFixed(1)} years ago`; }
const freshness=d=>{const m=daysAgo(d)/30.4; return m<6?'fresh':m<12?'aging':'stale';};
const byAdded=(x,y)=>y.added.localeCompare(x.added)||y.updated.localeCompare(x.updated)||x.title.localeCompare(y.title);
const byUpdated=(x,y)=>y.updated.localeCompare(x.updated)||x.title.localeCompare(y.title);
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('show'),2600);}

/* ── Previews ───────────────────────────────────────────────────────────── */
const TYPE_SVG={
  dashboard:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  notebook:'<path d="M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2z"/><path d="M9 7h6M9 11h6"/>',
  launchpad:'<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2"/><path d="M12 15l-3-3a15 15 0 0 1 10-9 15 15 0 0 1-7 12z"/>',
  app:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  agentic:'<rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M12 4.6V8"/><circle cx="12" cy="3.4" r="1.1"/><path d="M9 12.5h.01M15 12.5h.01M9.8 15.8h4.4"/>',
  ecosystem:'<circle cx="12" cy="12" r="3"/><circle cx="4.5" cy="6" r="2"/><circle cx="19.5" cy="6" r="2"/><circle cx="12" cy="20.5" r="2"/><path d="M6.2 7.2l3.4 2.9M17.8 7.2l-3.4 2.9M12 15v3.5"/>',
  cac:'<path d="M8 6l-6 6 6 6M16 6l6 6-6 6M14 4l-4 16"/>',
  cli:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10l3 2-3 2"/><path d="M13 15h4"/>',
  workflow:'<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a4 4 0 0 1 4 4v5.5"/>',
  blueprint:'<path d="M4 19.5V5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5z"/><path d="M9 8h6M9 12h6"/>',
};
const ph=a=>`<div class="ph"><svg viewBox="0 0 24 24">${TYPE_SVG[a.type]||TYPE_SVG.blueprint}</svg><span class="ph-lbl">${esc(TYPE[a.type].label)}</span></div>`;
/* Screenshot if the README has one, generated placeholder otherwise. Broken
   image URLs fall back to the placeholder via the global error handler below. */
function preview(a,i=0){
  const im=a.images[i];
  return im?`<img class="shot" loading="lazy" alt="${esc(im.caption||a.title)}" src="${esc(im.url)}" data-ph="${esc(a.id)}">`:ph(a);
}
document.addEventListener('error',e=>{
  const img=e.target; if(img.tagName!=='IMG'||!img.dataset.ph) return;
  const a=ART.find(x=>x.id===img.dataset.ph); if(a) img.outerHTML=ph(a);
},true);


/* ═══════════════════════════════════════════════════════════════════════════
   ROUTING — #/explore?area=Logs, #/explore?id=…, #/about, #/contribute, #/maintainers
   ═══════════════════════════════════════════════════════════════════════════ */
const VIEWS=['welcome','explore','about','contribute','maintainers'];
let CURRENT_VIEW=null;
