/* ═══════════════════════════════════════════════════════════════════════════
   SEARCH — weighted fields, prefix matching, synonyms and typo tolerance.
   Every query word has to match somewhere (AND); the score decides the order
   when "Best match" is the sort. Title hits weigh most, README text least.
   ═══════════════════════════════════════════════════════════════════════════ */
const typesOf=a=>a.types&&a.types.length?a.types:[a.type];
const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/ci\/cd/g,'cicd');
const stem=t=>t.length>4&&t.endsWith('s')&&!t.endsWith('ss')?t.slice(0,-1):t;
const toks=s=>norm(s).split(/[^a-z0-9]+/).filter(Boolean).map(stem);
const stripHtml=h=>String(h||'').replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/gi,' ');
/* Query word → words or phrases that should count as a match too. */
const SYN={
  k8s:['kubernetes'],kube:['kubernetes'],kubernete:['k8s'],otel:['opentelemetry'],opentelemetry:['otel'],
  tf:['terraform'],iac:['terraform','monaco','configuration as code'],cac:['configuration as code','monaco','terraform'],
  gitop:['argo','pipeline'],cicd:['pipeline','deployment'],ci:['pipeline','cicd'],cd:['deployment','pipeline'],
  pipeline:['cicd'],llm:['ai','genai','openai','claude','gemini'],genai:['llm','ai'],ai:['llm','agentic','genai'],
  agent:['agentic'],agentic:['agent'],sre:['reliability','incident'],slo:['service level objective','service-level'],
  log:['syslog','logs'],logs:['log','syslog'],cost:['dps','billing','budget','finops','spend'],finop:['cost','dps'],
  billing:['cost','dps'],budget:['cost','quota'],vuln:['vulnerability','security'],vulnerability:['security','dependabot'],
  security:['vulnerability','appsec'],rum:['real user','user experience'],ux:['user experience','rum'],
  gcp:['google cloud'],ad:['active directory'],dash:['dashboard'],alert:['notification','alerting','problem'],
  alerting:['notification','alert'],incident:['problem','postmortem'],postmortem:['incident'],
  ticket:['jira','servicenow','linear'],chat:['slack','teams'],automation:['workflow'],workflow:['automation'],
};
const FIELD_W={title:10,tech:8,tags:6,facets:5,summary:3,body:1};
ART.forEach(a=>{
  const f={title:a.title,tech:a.tech.join(' '),tags:[...a.tags,...a.capabilities].join(' '),
           facets:[...a.areas,...typesOf(a).map(t=>TYPE[t].label),a.path.replace(/[-_/]/g,' ')].join(' '),
           summary:a.summary,body:stripHtml(a.overviewHtml+' '+a.prereqsHtml+' '+a.setupHtml)};
  a._ix=Object.fromEntries(Object.entries(f).map(([k,v])=>[k,{text:norm(v),toks:[...new Set(toks(v))]}]));
});
function lev(a,b,max){
  if(Math.abs(a.length-b.length)>max) return max+1;
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    const cur=[i]; let best=i;
    for(let j=1;j<=b.length;j++){ cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1)); best=Math.min(best,cur[j]); }
    if(best>max) return max+1; prev=cur;
  }
  return prev[b.length];
}
function termQuality(t,fld,key){
  if(fld.toks.includes(t)) return 1;
  if(t.length>=2 && fld.toks.some(x=>x.startsWith(t))) return .8;
  /* Synonyms only count in curated fields — in long README text they match too much. */
  if(key!=='body') for(const s of SYN[t]||[]){
    if(s.includes(' ')? fld.text.includes(s) : fld.toks.some(x=>x.startsWith(stem(s)))) return .7;
  }
  if(t.length>=4 && key!=='body'){
    const max=t.length>=8?2:1;
    if(fld.toks.some(x=>lev(t,x,max)<=max)) return .5;
  }
  return 0;
}
const queryTerms=q=>toks(q).filter(t=>t.length>1||/\d/.test(t));
function scoreOf(a,terms,qn){
  if(!terms.length) return 1;
  let sum=0;
  for(const t of terms){
    let best=0;
    for(const k in FIELD_W){ const q=termQuality(t,a._ix[k],k); if(q) best=Math.max(best,FIELD_W[k]*q); }
    if(!best) return 0;
    sum+=best;
  }
  return sum+(a._ix.title.text.includes(qn)?15:0);
}
/* Wrap the query words (and one-word synonyms) in <mark> inside already-escaped text. */
function highlight(escaped,q){
  const words=new Set(queryTerms(q));
  [...words].forEach(t=>(SYN[t]||[]).forEach(s=>{ if(!s.includes(' ')) words.add(s); }));
  const list=[...words].filter(w=>w.length>1).map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  if(!list.length) return escaped;
  return escaped.replace(new RegExp(`(^|[^a-z0-9&#])(${list.join('|')})`,'gi'),'$1<mark>$2</mark>');
}
