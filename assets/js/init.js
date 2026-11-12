/* ═══════════════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════════════ */
(function init(){
  const sync=C.sourceCommit?`Synced from ${C.repo.replace('https://github.com/','')} @ ${C.sourceCommit.slice(0,7)} (${fmtDate(C.sourceDate)}).`:'Catalog not generated yet.';
  $('#mSync').textContent=sync;
  $('#contribGuide').href=C.repo+'/blob/main/CONTRIBUTING.md';
  $('#repoLink').href=$('#contribRepo').href=C.repo;
  $('#contribTemplate').href=C.repo+'/blob/main/templates/EXAMPLE-README-template.md';
  if(!ART.length) toast('data/catalog-repo.js is missing — run the sync workflow');
  buildStrips(); renderAreas(); route();
})();
