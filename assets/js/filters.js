/* ═══════════════════════════════════════════════════════════════════════════
   FILTERS ON SMALL SCREENS — the sidebar becomes a slide-in panel
   ═══════════════════════════════════════════════════════════════════════════ */
function setRail(open){
  const was=$('.rail').classList.contains('open');
  $('.rail').classList.toggle('open',open); $('#railBackdrop').classList.toggle('open',open);
  document.body.classList.toggle('rail-open',open);
  if(open&&!was) $('#railTitle').focus({preventScroll:true});
  else if(!open&&was) $('#filterBtn').focus({preventScroll:true});
}
/* While the slide-in panel covers the page, Tab stays inside it. */
document.addEventListener('keydown',e=>{
  if(e.key!=='Tab'||!$('.rail').classList.contains('open')) return;
  const f=[...$$('.rail button,.rail input,.rail summary')].filter(x=>x.offsetParent!==null);
  if(!f.length) return;
  const i=f.indexOf(document.activeElement);
  if(i===-1||(e.shiftKey&&i===0)||(!e.shiftKey&&i===f.length-1)){
    e.preventDefault(); f[i===-1||!e.shiftKey?0:f.length-1].focus();
  }
});
$('#filterBtn').addEventListener('click',()=>setRail(true));
$('#railDone').addEventListener('click',()=>setRail(false));
$('#railBackdrop').addEventListener('click',()=>setRail(false));
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && $('.rail').classList.contains('open')) setRail(false); });
