/* ═══════════════════════════════════════════════════════════════════════════
   MAINTAINERS — read-only health view of the repo
   ═══════════════════════════════════════════════════════════════════════════ */
let mSort={key:'updated',dir:-1};
function renderMaintainers(){
  const noImg=ART.filter(a=>!a.images.length).length, noFm=ART.filter(a=>!a.hasFrontMatter).length;
  const stale=ART.filter(a=>freshness(a.updated)==='stale').length;
  $('#mStats').innerHTML=`
    <div class="stat"><div class="n">${ART.length}</div><div class="l">Solutions in the repo</div></div>
    <div class="stat ${noImg?'warn':''}"><div class="n">${noImg}</div><div class="l">Missing a screenshot</div></div>
    <div class="stat ${noFm?'warn':''}"><div class="n">${noFm}</div><div class="l">Missing the README metadata header</div></div>
    <div class="stat ${stale?'crit':''}"><div class="n">${stale}</div><div class="l">Not updated in 12+ months</div></div>`;
  const K={title:a=>a.title.toLowerCase(),type:a=>TYPE[a.type].label,areas:a=>a.areas.join(','),added:a=>a.added,
           updated:a=>a.updated,images:a=>a.images.length,fm:a=>a.hasFrontMatter?1:0};
  const rows=[...ART].sort((x,y)=>{const a=K[mSort.key](x),b=K[mSort.key](y);return (a<b?-1:a>b?1:0)*mSort.dir;});
  $$('#view-maintainers thead th').forEach(th=>th.setAttribute('aria-sort',
    th.dataset.sort===mSort.key?(mSort.dir>0?'ascending':'descending'):'none'));
  $('#mRows').innerHTML=rows.map(a=>{
    const fr=freshness(a.updated);
    return `<tr><td><a class="ttl" href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.title)}</a><span class="sub">${esc(a.path)}</span></td>
      <td>${esc(TYPE[a.type].label)}</td><td>${a.areas.map(esc).join(', ')}</td><td>${fmtDate(a.added)}</td>
      <td><span class="chip ${fr==='fresh'?'ok':fr==='aging'?'warn':'crit'}">${fmtDate(a.updated)}</span></td>
      <td>${a.images.length?`<span class="yes">✓ ${a.images.length}</span>`:'<span class="no">✗ none</span>'}</td>
      <td>${a.hasFrontMatter?'<span class="yes">✓</span>':'<span class="no">✗ missing</span>'}</td></tr>`;
  }).join('');
}
$('#view-maintainers thead').addEventListener('click',e=>{
  const th=e.target.closest('[data-sort]'); if(!th) return;
  mSort={key:th.dataset.sort,dir:mSort.key===th.dataset.sort?-mSort.dir:(['added','updated','images','fm'].includes(th.dataset.sort)?-1:1)};
  renderMaintainers();
});
