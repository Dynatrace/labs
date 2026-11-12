/* ═══════════════════════════════════════════════════════════════════════════
   GET STARTED — a high-level summary of how to adopt the solution (curated in
   content/overrides/<id>.json, "getStarted"). The full steps live in the
   source repository ("View source"), so there are no downloads or commands here.
   ═══════════════════════════════════════════════════════════════════════════ */
function getStartedHtml(a){
  const body=a.getStartedHtml
    ? `<div class="md">${h3(a.getStartedHtml)}</div>`
    : `<p class="gs-lead">Follow the setup in the source repository: <strong>View source</strong> has the files and full instructions.</p>`;
  return `<div class="dsec getstarted"><h2 class="t-h5">Get started</h2>${body}</div>`;
}
/* Bottom actions: "View source" is the main button; apps that are installed from the
   Hub (or on request) get that as the main action instead. */
function paintPrimary(a){
  const b=$('#dPrimary'), ns=a.nextStep||{};
  b.hidden=!(ns.kind==='request'||ns.kind==='hub');
  $('#dRepo').className='btn '+(b.hidden?'btn-primary':'btn-secondary');
  if(ns.kind==='request'){
    const mail=`mailto:${ns.email}?subject=${encodeURIComponent('App request: '+a.title)}&body=${encodeURIComponent('Hi,\n\nplease enable "'+a.title+'" for:\n\nAccount name:\nTenant ID:\n\nThanks!')}`;
    b.textContent='Request app ✉';
    b.onclick=()=>{ track('get_started',{...solAttrs(a),action:'request_access',location:'footer'}); location.href=mail; };
  } else if(ns.kind==='hub'){
    b.textContent='Get it on Dynatrace Hub';
    b.onclick=()=>{ track('get_started',{...solAttrs(a),action:'open_hub',location:'footer'}); window.open(ns.url,'_blank','noopener'); };
  }
}
$('#dRepo').addEventListener('click',()=>{ if(CUR) track('get_started',{...solAttrs(CUR),action:'view_source',location:'footer'}); });
