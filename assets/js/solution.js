/* ═══════════════════════════════════════════════════════════════════════════
   DETAIL PANEL — docked on the right, not modal: the grid stays usable and
   clicking another card swaps the content. The open solution is part of the
   URL (s=…), so every solution has its own shareable link.
   ═══════════════════════════════════════════════════════════════════════════ */
let SHOT=0, CUR=null, detailReturnId=null;
/* While the dialog is open the page behind it is inert: no clicks, no Tab, hidden from screen readers. */
const bgInert=on=>$$('header, main, footer').forEach(el=>{ el.inert=on; });
let openGuard=null;
const guardOpening=on=>{ clearTimeout(openGuard); document.body.classList.toggle('dialog-opening',on);
  if(on) openGuard=setTimeout(()=>document.body.classList.remove('dialog-opening'),350); };
$('#drawerBackdrop').addEventListener('click',()=>closeDetail());
/* Tab stays inside the dialog (the screenshot viewer has its own trap). */
document.addEventListener('keydown',e=>{
  if(e.key!=='Tab'||!CUR||!$('#lightbox').hidden) return;
  const f=[...$$('#drawer a[href],#drawer button,#drawer input,#drawer summary')].filter(x=>!x.hidden&&!x.disabled&&x.offsetParent!==null);
  if(!f.length) return;
  const ae=document.activeElement;
  if(e.shiftKey&&(ae===f[0]||ae===$('#dTitle')||!f.includes(ae))){ e.preventDefault(); f[f.length-1].focus(); }
  else if(!e.shiftKey&&(ae===f[f.length-1]||!f.includes(ae))){ e.preventDefault(); f[0].focus(); }
});
/* README sub-headings sit one level below the section heading (h2 → h3). */
const h3=html=>(html||'').replace(/<(\/?)h4>/g,'<$1h3>');
/* The screenshot is a button: keyboard users can open the viewer too. */
function galMainHtml(a,i){
  return a.images.length?`<button class="gal-open" type="button" aria-label="Open screenshot ${i+1} of ${a.images.length} full page">${preview(a,i)}</button>`:preview(a,i);
}
const solutionLink=a=>location.href.split('#')[0]+'#/explore?s='+encodeURIComponent(a.id);
function openDetail(id,{fromRoute=false}={}){
  const a=ART.find(x=>x.id===id); if(!a) return; const prevId=CUR&&CUR.id; CUR=a; SHOT=0;
  if(prevId!==a.id) track('solution_open',{...solAttrs(a),...(OPEN_SOURCE||{source:fromRoute?'link':'other'})});
  OPEN_SOURCE=null;
  const fr=freshness(a.updated);
  $('#dChips').innerHTML=typesOf(a).map(t=>`<span class="tag type">${esc(TYPE[t].label)}</span>`).join('')+
    a.areas.filter(x=>x!=='Other').map(x=>`<span class="tag">${esc(x)}</span>`).join('')+
    (daysAgo(a.added)<30?'<span class="chip new">New</span>':'')+
    (fr==='stale'?'<span class="chip crit">Not updated in 12+ months</span>':'');
  $('#dTitle').textContent=a.title;
  $('#dMeta').textContent=`Added ${fmtDate(a.added)} · updated ${relDate(a.updated)}`;
  $('#dRepo').href=a.url; paintPrimary(a);
  /* Issues go to the solution's own source repo; curated entries may name their own issue tracker. */
  const issue=a.issuesUrl||`${(a.source&&a.source.repo)||C.repo}/issues/new?title=${encodeURIComponent('['+a.path+'] ')}`;
  $('#dIssue').href=issue; $('#dIssue').hidden=!/^https:\/\/github\.com\//.test(issue);
  const tags=[...a.capabilities,...a.tags];
  $('#drawerBody').innerHTML=`
    ${a.images.length?`<div class="gallery">
      <div class="main" id="galMain">${galMainHtml(a,0)}</div>
      <div class="cap" id="galCap">${esc(a.images[0].caption||'Screenshot 1 of '+a.images.length)}</div>
      ${a.images.length>1?`<div class="strip">${a.images.map((im,i)=>`<button data-shot="${i}" class="${i?'':'on'}" aria-label="Screenshot ${i+1}">${preview(a,i)}</button>`).join('')}</div>`:''}
    </div>`:''}
    <div class="dsec"><h2 class="t-h5">Overview</h2><div class="md">${h3(a.overviewHtml)||`<p>${esc(a.summary)}</p>`}</div></div>
    ${a.getStartedHtml?'':(a.prereqsHtml?`<div class="dsec"><h2 class="t-h5">Prerequisites</h2><div class="md">${h3(a.prereqsHtml)}</div></div>`:'')}
    ${getStartedHtml(a)}
    ${tags.length?`<div class="dsec dtags"><h2 class="t-h5">Tags</h2><div class="tagrow">${tags.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div></div>`:''}`;
  $('#drawer').classList.add('open'); document.body.classList.add('panel-open');
  guardOpening(true); $('#drawerBackdrop').hidden=false; bgInert(true); $('#drawerBody').scrollTop=0;   // the page behind keeps its scroll position
  $$('#cards .acard').forEach(c=>c.classList.toggle('selected',c.dataset.id===a.id));
  if(!fromRoute) syncHash();
  updateTitle();
  /* Remember the card to come back to, and take the keyboard to the panel —
     otherwise it is only reachable after tabbing through every card. */
  const from=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('.acard');
  detailReturnId=from?from.dataset.id:a.id;
  if(!fromRoute) $('#dTitle').focus({preventScroll:true});
}
function showShot(i){
  SHOT=i; $('#galMain').innerHTML=galMainHtml(CUR,SHOT);
  $('#galCap').textContent=CUR.images[SHOT].caption||`Screenshot ${SHOT+1} of ${CUR.images.length}`;
  $$('.gallery .strip button').forEach(x=>x.classList.toggle('on',+x.dataset.shot===SHOT));
}
$('#drawerBody').addEventListener('click',e=>{
  if(!CUR) return;
  const b=e.target.closest('[data-shot]'); if(b){ showShot(+b.dataset.shot); return; }
  if(e.target.closest('#galMain') && CUR.images.length) openLightbox(SHOT);
});

/* Full-page screenshot viewer. Arrow keys / ‹ › step through the solution's
   screenshots and keep the panel's gallery in sync; Esc, ✕ or a click on the
   backdrop closes it. */
let lbReturn=null;
function paintLightbox(){
  const im=CUR.images[SHOT], n=CUR.images.length;
  $('#lbxImg').src=im.url; $('#lbxImg').alt=im.caption||CUR.title;
  $('#lbxCap').textContent=`${CUR.title} — ${im.caption||'Screenshot'}${n>1?` (${SHOT+1} of ${n})`:''}`;
  $('#lbxPrev').hidden=$('#lbxNext').hidden=n<2;
}
function openLightbox(i){
  lbReturn=document.activeElement; showShot(i); paintLightbox();
  track('screenshot_view',{...solAttrs(CUR),'screenshot.index':i+1,'screenshot.count':CUR.images.length});
  $('#lightbox').hidden=false; document.body.classList.add('lbx-open'); $('#lbxClose').focus();
}
function closeLightbox(){
  $('#lightbox').hidden=true; document.body.classList.remove('lbx-open');
  /* Stepping through screenshots re-renders the panel's button, so fall back to the new one. */
  const r=lbReturn&&lbReturn.isConnected?lbReturn:$('#galMain .gal-open'); if(r) r.focus();
}
function stepLightbox(d){ const n=CUR.images.length; showShot((SHOT+d+n)%n); paintLightbox(); }
$('#lbxClose').addEventListener('click',closeLightbox);
$('#lbxPrev').addEventListener('click',()=>stepLightbox(-1));
$('#lbxNext').addEventListener('click',()=>stepLightbox(1));
$('#lightbox').addEventListener('click',e=>{ if(e.target===e.currentTarget||e.target.tagName==='FIGURE') closeLightbox(); });
/* Capture phase: while the viewer is open, Esc closes only the viewer, not the panel behind it. */
window.addEventListener('keydown',e=>{
  if($('#lightbox').hidden) return;
  if(e.key==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); closeLightbox(); }
  else if(e.key==='ArrowRight'){ e.preventDefault(); stepLightbox(1); }
  else if(e.key==='ArrowLeft'){ e.preventDefault(); stepLightbox(-1); }
  else if(e.key==='Tab'){   // keep focus inside the dialog
    const f=[...$$('#lightbox button')].filter(b=>!b.hidden), i=f.indexOf(document.activeElement);
    e.preventDefault(); f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus();
  }
},true);
function closeDetail({fromRoute=false}={}){
  const was=!!CUR; CUR=null;
  const ae=document.activeElement, focusInPanel=!!ae&&(ae===document.body||!!ae.closest('#drawer'));
  $('#drawer').classList.remove('open'); document.body.classList.remove('panel-open');
  guardOpening(false); $('#drawerBackdrop').hidden=true; bgInert(false);   // before focus goes back to the card
  $$('#cards .acard.selected').forEach(c=>c.classList.remove('selected'));
  if(was && !fromRoute) syncHash();
  if(was) updateTitle();
  /* Back to the card the panel was opened from (or the page heading if it isn't shown). */
  if(was && !fromRoute && focusInPanel){
    const c=detailReturnId&&$(`#cards .acard[data-id="${CSS.escape(detailReturnId)}"] .acard-open`);
    (c||$('#exploreTitle')).focus();
  }
}
$('#closeDrawer').addEventListener('click',()=>closeDetail());
$('#copyLink').addEventListener('click',async()=>{
  if(!CUR) return; const url=solutionLink(CUR);
  track('share',solAttrs(CUR));
  try{ await navigator.clipboard.writeText(url); toast('Link copied — paste it anywhere to share this solution'); }
  catch(e){ window.prompt('Copy this link:',url); }
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && CUR && !(e.target instanceof Element && e.target.closest('#heroForm'))) closeDetail();
});
