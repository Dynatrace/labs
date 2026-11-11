/* ═══ USAGE ANALYTICS ═══════════════════════════════════════════════════════
   Business events for Dynatrace RUM.
   Anonymous: a random id per browser tab, no names or e-mail addresses. Events wait
   until the RUM script has loaded; without RUM (tests, local preview, blocked by the
   browser) they are dropped. */
const ANALYTICS_VERSION='cookbook-0.3';
const DC_SESSION=(()=>{ try{ let s=sessionStorage.getItem('dtDevCommunity.sid');
  if(!s){ s=Math.random().toString(36).slice(2,10)+Date.now().toString(36); sessionStorage.setItem('dtDevCommunity.sid',s); }
  return s; }catch(e){ return 'no-storage'; } })();
const trackQueue=[];
function track(name,attrs={}){
  if(trackQueue.length>200) trackQueue.shift();
  trackQueue.push(['devcommunity.'+name,{'dc.session':DC_SESSION,'app.version':ANALYTICS_VERSION,
    'page.view':CURRENT_VIEW||'welcome','device':innerWidth<640?'phone':innerWidth<1000?'tablet':'desktop',
    'theme':document.documentElement.getAttribute('data-theme'),...attrs}]);
  flushTrack();
}
function flushTrack(){
  const d=window.dynatrace; if(!d||typeof d.sendBizEvent!=='function') return;
  while(trackQueue.length){ const [t,a]=trackQueue.shift(); try{ d.sendBizEvent(t,a); }catch(e){} }
}
{ let n=0; const t=setInterval(()=>{ flushTrack(); if(++n>40||!trackQueue.length) clearInterval(t); },500); }
const solAttrs=a=>({'solution.id':a.id,'solution.title':a.title,'solution.type':a.type});
const normQuery=q=>q.trim().toLowerCase().replace(/\s+/g,' ').slice(0,100);
let OPEN_SOURCE=null, SEARCH_SOURCE='explore', lastSearch='', searchTimer=null;
/* A search counts once the visitor stops typing (1.5 s), presses Enter or leaves the box. */
function trackSearch(){
  clearTimeout(searchTimer);
  const q=normQuery($('#q').value); if(!q||q===lastSearch) return; lastSearch=q;
  const n=results().length;
  track('search',{'search.query':q,'search.results':n,'search.zero':n===0,'source':SEARCH_SOURCE});
  SEARCH_SOURCE='explore';
}
