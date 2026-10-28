/* Public mobile comparison. Install a Chrome-compatible Lighthouse under runtime/perf-tools first.
   Run: node assets/qa/compare-lighthouse.cjs [before|after]
   Every audit launches a clean Chrome profile. Keep other browser/CPU jobs idle.
   Raw reports stay ignored; comparison summaries can be retained with the report. */
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{spawn}=require('node:child_process'),os=require('node:os');
const cli=process.env.LIGHTHOUSE_CLI||path.join(__dirname,'runtime/perf-tools/node_modules/lighthouse/cli/index.js');
const stage=process.argv[2]||'before';
if(!['before','after'].includes(stage))throw Error('Stage must be before or after');
const directory=path.join(__dirname,'runtime/url-comparison',stage);
fs.mkdirSync(directory,{recursive:true});
const urls={new:'https://l.fluenti.com.br/caderninho/',old:'https://caderninho-marcia.vercel.app/'};
const metricIds={lcp:'largest-contentful-paint',fcp:'first-contentful-paint',tbt:'total-blocking-time',cls:'cumulative-layout-shift',speedIndex:'speed-index',bytes:'total-byte-weight'};
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const runs=[],counts={new:0,old:0};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function launch(){
  const profile=path.join(os.tmpdir(),'caderninho-lh-profile-'+Date.now());
  const child=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
  let port;
  for(let i=0;i<150&&!port;i++){
    try{port=Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0])}catch{}
    if(!port)await sleep(200);
  }
  if(!port){child.kill();throw Error('Chrome did not start');}
  return {port,async close(){
    const version=await(await fetch(`http://127.0.0.1:${port}/json/version`)).json();
    const socket=new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
    socket.send(JSON.stringify({id:1,method:'Browser.close'}));
    await new Promise(resolve=>{socket.addEventListener('close',resolve,{once:true});setTimeout(resolve,2000)});
    socket.close();
  }};
}
(async()=>{
  console.log('Loading Lighthouse '+new Date().toISOString());
  const {default:lighthouse}=await import(pathToFileURL(path.resolve(path.dirname(cli),'../core/index.js')));
  console.log('Lighthouse ready '+new Date().toISOString());
  for(const label of ['new','old','old','new','new','old']){
    const number=++counts[label];
    const file=path.join(directory,`${label}-${number}.json`);
    console.log(`START ${label} ${number}/3 ${urls[label]}`);
    const chrome=await launch();
    console.log('Chrome ready '+chrome.port+' '+new Date().toISOString());
    let result;
    try{result=await lighthouse(urls[label],{port:chrome.port,onlyCategories:['performance'],formFactor:'mobile',throttlingMethod:'simulate',output:'json',logLevel:'error'});}
    finally{await chrome.close();}
    const lhr=result.lhr;
    fs.writeFileSync(file,JSON.stringify(lhr));
    if(lhr.runtimeError)throw Error(JSON.stringify(lhr.runtimeError));
    const auditErrors=Object.values(lhr.audits).filter(audit=>audit.scoreDisplayMode==='error').map(audit=>({id:audit.id,error:audit.errorMessage}));
    if(auditErrors.length)throw Error('Incomplete diagnostics: '+JSON.stringify(auditErrors));
    const requests=lhr.audits['network-requests'].details.items;
    const metrics={performance:Math.round(lhr.categories.performance.score*100)};
    for(const [key,id] of Object.entries(metricIds))metrics[key]=lhr.audits[id].numericValue;
    const run={label,number,url:urls[label],finalUrl:lhr.finalDisplayedUrl||lhr.finalUrl,
      fetchedAt:lhr.fetchTime,version:lhr.lighthouseVersion,userAgent:lhr.userAgent,
      benchmarkIndex:lhr.environment.benchmarkIndex,settings:lhr.configSettings,metrics,
      requests:requests.filter(r=>/^https?:/.test(r.url)).length,traceEntries:requests.length,errors:requests.filter(r=>r.statusCode>=400).map(r=>({url:r.url,status:r.statusCode})),
      redirects:lhr.audits.redirects?.details?.items||[],warnings:lhr.runWarnings,
      topResources:requests.filter(r=>r.transferSize>0).sort((a,b)=>b.transferSize-a.transferSize).slice(0,10).map(r=>({url:r.url,bytes:r.transferSize,type:r.resourceType,status:r.statusCode})),
      resources:lhr.audits['resource-summary']?.details?.items,
      mainThread:lhr.audits['mainthread-work-breakdown']?.details?.items,
      lcpElement:lhr.audits['largest-contentful-paint-element']?.details?.items
    };
    runs.push(run);
    fs.writeFileSync(path.join(directory,'runs.json'),JSON.stringify(runs,null,2)+'\n');
    console.log('RESULT '+JSON.stringify({label,number,metrics,requests:run.requests,errors:run.errors,warnings:run.warnings}));
  }
  const summary={stage,method:`Lighthouse ${runs[0].version} mobile simulated; clean Chrome per run; order new/old/old/new/new/old; medians calculated independently per metric`,runs,medians:{},ranges:{}};
  for(const label of Object.keys(urls)){
    const selected=runs.filter(r=>r.label===label);
    summary.medians[label]={};summary.ranges[label]={};
    for(const key of Object.keys(selected[0].metrics)){
      const values=selected.map(r=>r.metrics[key]);
      summary.medians[label][key]=median(values);
      summary.ranges[label][key]=[Math.min(...values),Math.max(...values)];
    }
    summary.medians[label].requests=median(selected.map(r=>r.requests));
  }
  fs.writeFileSync(path.join(directory,'summary.json'),JSON.stringify(summary,null,2)+'\n');
  console.log('MEDIANS '+JSON.stringify(summary.medians));
})().catch(error=>{console.error(error);process.exitCode=1});
