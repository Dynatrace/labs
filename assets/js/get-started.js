/* ═══════════════════════════════════════════════════════════════════════════
   GET STARTED — the next step for a solution, chosen by the catalog generator
   (nextStep): download the file to import, copy the Monaco / Terraform deploy
   commands, or request the app. Falls back to the GitHub folder.
   ═══════════════════════════════════════════════════════════════════════════ */
const IMPORTABLE=['Dashboard','Notebook','Workflow','Agent instructions'];
const IMPORT_HINT={
  Dashboard:'In Dynatrace, open <strong>Dashboards</strong> → <strong>Upload</strong> and pick the file.',
  Notebook:'In Dynatrace, open <strong>Notebooks</strong> → <strong>Upload</strong> and pick the file.',
  Workflow:'In Dynatrace, open <strong>Workflows</strong> → <strong>Upload</strong> and pick the file.',
  'Agent instructions':'Add the file to your AI assistant’s instructions — e.g. <span class="code">.github/</span> for Copilot, a steering file for Kiro, or a Claude project.'};
const fmtSize=n=>n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(n<10240?1:0)} KB`:`${(n/1048576).toFixed(1)} MB`;
function sparseClone(a,dir){
  return ['git clone --depth 1 --filter=blob:none --sparse https://github.com/Dynatrace/community-examples.git',
          'cd community-examples',
          `git sparse-checkout set "${a.path}"`,
          `cd "${a.path}${dir?'/'+dir:''}"`];
}
function deployCommands(a){
  const ns=a.nextStep;
  if(ns.kind==='monaco') return [...sparseClone(a,ns.dir),'monaco deploy manifest.yaml'].join('\n');
  if(ns.kind==='terraform') return [...sparseClone(a,ns.dir),'terraform init','terraform plan','terraform apply'].join('\n');
  return '';
}
function fileRow(f,i){
  return `<li class="frow"><span class="tag ${IMPORTABLE.includes(f.kind)?'type':''}">${esc(f.kind)}</span>
    <span class="fname" title="${esc(f.path)}">${esc(f.path)}</span><span class="fsize">${fmtSize(f.size)}</span>
    <button class="btn btn-secondary btn-sm" data-dl="${i}" aria-label="Download ${esc(f.name)}">⤓ Download</button></li>`;
}
function getStartedHtml(a){
  const ns=a.nextStep||{kind:'github'}, files=a.files||[];
  const imp=files.filter(f=>IMPORTABLE.includes(f.kind)), other=files.filter(f=>!IMPORTABLE.includes(f.kind));
  let body='';
  if(ns.kind==='import'){
    const kinds=[...new Set(imp.map(f=>f.kind))];
    body=`<ol class="steps-ol"><li>Download the ${imp.length>1?'files — or all of them at once as a .zip':'file'} below.</li>
      ${kinds.map(k=>`<li>${IMPORT_HINT[k]}</li>`).join('')}
      <li>Follow the Setup notes below for anything to adjust in your environment.</li></ol>
      <ul class="flist">${imp.map(f=>fileRow(f,files.indexOf(f))).join('')}</ul>
      ${files.length>1?`<button class="btn btn-secondary btn-sm dl-all" data-dl-all>⤓ Download all (${files.length} files, .zip)</button>`:''}`;
  } else if(ns.kind==='monaco'||ns.kind==='terraform'){
    const tool=ns.kind==='monaco'?'Monaco CLI':'Terraform';
    body=`<p class="gs-lead">Deploy it with ${tool}: fetch just this folder, then apply it to your environment.</p>
      <div class="cmdblock"><div class="cmd-bar"><span>Terminal</span><button class="btn btn-sm cmd-copy" data-copy="deploy">Copy</button></div>
        <pre id="deployCmd">${esc(deployCommands(a))}</pre></div>
      <p class="gs-note">Needs the ${tool} and the credentials / environment variables described under Setup.</p>`;
  } else if(ns.kind==='request'||ns.kind==='hub'){
    body=ns.kind==='hub'
      ?`<p class="gs-lead">This app is installed from the Dynatrace Hub.</p>`
      :`<p class="gs-lead">This app is installed from the Dynatrace Hub on request. Send your account name and tenant ID to
          <a href="mailto:${esc(ns.email)}">${esc(ns.email)}</a> — the <strong>Request the app</strong> button prepares the email.</p>`;
  } else {
    body=`<p class="gs-lead">Get the files from the GitHub folder and follow the Setup notes below.</p>`;
  }
  if(other.length && ns.kind!=='request'){
    body+=`<details class="more-files"><summary>${ns.kind==='import'?'Other files':'Files in this solution'} (${other.length})</summary>
      <ul class="flist">${other.map(f=>fileRow(f,files.indexOf(f))).join('')}</ul></details>`;
  }
  return `<div class="dsec getstarted"><h2 class="t-h5">Get started</h2>${body}`+
    (a.setupHtml?`<h3 class="gs-sub">Setup</h3><div class="md">${a.setupHtml}</div>`:'')+'</div>';
}
/* Bottom actions: only apps get an extra button (request it, or get it on the Hub). Downloads and
   deploy commands live in Get started. */
function paintPrimary(a){
  const b=$('#dPrimary'), ns=a.nextStep||{};
  b.hidden=!(ns.kind==='request'||ns.kind==='hub');
  if(ns.kind==='request'){
    const mail=`mailto:${ns.email}?subject=${encodeURIComponent('App request: '+a.title)}&body=${encodeURIComponent('Hi,\n\nplease enable "'+a.title+'" for:\n\nAccount name:\nTenant ID:\n\nThanks!')}`;
    b.textContent='Request app ✉';
    b.onclick=()=>{ track('get_started',{...solAttrs(a),action:'request_access',location:'footer'}); location.href=mail; };
  } else if(ns.kind==='hub'){
    b.textContent='Get it on Dynatrace Hub';
    b.onclick=()=>{ track('get_started',{...solAttrs(a),action:'open_hub',location:'footer'}); window.open(ns.url,'_blank','noopener'); };
  }
}
/* "Download all": fetch every file of the solution and pack them into one .zip
   (stored, uncompressed — the files are small text). No library needed. */
const CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC_TABLE[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zipStore(files){
  const enc=new TextEncoder(), parts=[], central=[]; let offset=0;
  for(const f of files){
    const name=enc.encode(f.name), size=f.data.length, crc=crc32(f.data);
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true); lh.setUint16(4,20,true); lh.setUint16(6,0x0800,true);   // UTF-8 names
    lh.setUint16(12,0x21,true);                                                              // 1980-01-01
    lh.setUint32(14,crc,true); lh.setUint32(18,size,true); lh.setUint32(22,size,true); lh.setUint16(26,name.length,true);
    parts.push(new Uint8Array(lh.buffer),name,f.data);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true); ch.setUint16(4,20,true); ch.setUint16(6,20,true); ch.setUint16(8,0x0800,true);
    ch.setUint16(14,0x21,true); ch.setUint32(16,crc,true); ch.setUint32(20,size,true); ch.setUint32(24,size,true);
    ch.setUint16(28,name.length,true); ch.setUint32(42,offset,true);
    central.push(new Uint8Array(ch.buffer),name);
    offset+=30+name.length+size;
  }
  const cdSize=central.reduce((n,p)=>n+p.length,0), end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true); end.setUint16(8,files.length,true); end.setUint16(10,files.length,true);
  end.setUint32(12,cdSize,true); end.setUint32(16,offset,true);
  return new Blob([...parts,...central,new Uint8Array(end.buffer)],{type:'application/zip'});
}
function saveBlob(blob,name){
  const url=URL.createObjectURL(blob), el=document.createElement('a');
  el.href=url; el.download=name; document.body.append(el); el.click(); el.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}
async function downloadAll(a){
  const files=a.files||[], slug=a.path.split('/').pop();
  toast(`Preparing ${files.length} files…`);
  try{
    const data=await Promise.all(files.map(async f=>{
      const r=await fetch(f.url); if(!r.ok) throw new Error(f.path+': '+r.status);
      return {name:slug+'/'+f.path, data:new Uint8Array(await r.arrayBuffer())};
    }));
    saveBlob(zipStore(data),slug+'.zip'); toast(`Downloaded ${slug}.zip (${files.length} files)`);
  }catch(e){ toast('Could not build the zip — opening the GitHub folder instead'); window.open(a.url,'_blank','noopener'); }
}
/* raw.githubusercontent.com allows cross-origin reads, so files download with
   their real name instead of opening as text in a new tab. */
async function downloadFile(f){
  try{
    const r=await fetch(f.url); if(!r.ok) throw new Error(r.status);
    const url=URL.createObjectURL(await r.blob()), el=document.createElement('a');
    el.href=url; el.download=f.name; document.body.append(el); el.click(); el.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000); toast(`Downloaded ${f.name}`);
  }catch(e){ window.open(f.url,'_blank','noopener'); }
}
async function copyText(text,msg){
  try{ await navigator.clipboard.writeText(text); toast(msg); }
  catch(e){ window.prompt('Copy:',text); }
}
$('#drawerBody').addEventListener('click',e=>{
  if(!CUR) return;
  const gs=(action,extra={})=>track('get_started',{...solAttrs(CUR),action,location:'panel',...extra});
  const d=e.target.closest('[data-dl]'); if(d){ const f=CUR.files[+d.dataset.dl];
    gs('download_file',{'file.name':f.name,'file.kind':f.kind}); downloadFile(f); return; }
  if(e.target.closest('[data-dl-all]')){ gs('download_zip'); downloadAll(CUR); return; }
  if(e.target.closest('[data-copy="deploy"]')){ gs('copy_command'); copyText(deployCommands(CUR),'Deploy commands copied'); }
});
