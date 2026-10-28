/* Supplement Lighthouse with a cold/warm mobile waterfall and curl -I headers.
   Run only after Lighthouse is idle: node assets/qa/compare-network.cjs
   Node 22+ and Chrome required; CHROME_PATH can override the binary.
   No page changes, purchase clicks, scroll or animation overrides are applied. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');
const out=path.resolve(__dirname,'runtime/url-comparison/network');
const urls={new:'https://l.fluenti.com.br/caderninho/',old:'https://caderninho-marcia.vercel.app/'};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const header=(headers,key)=>Object.entries(headers||{}).find(([name])=>name.toLowerCase()===key)?.[1]??null;
const selectedHeaders=headers=>Object.fromEntries(['cache-control','x-vercel-cache','age','content-encoding','content-type','content-length','etag','x-vercel-id'].map(key=>[key,header(headers,key)]));
fs.mkdirSync(out,{recursive:true});
async function waterfall(label,url){
  const profile=path.join(out,`chrome-${label}-${Date.now()}`);
  const chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
  let socket,sequence=0,records=[],active=new Map(),errors=[],pending=new Map();
  function rpc(method,params={}){return new Promise((resolve,reject)=>{
    const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},30000);
    pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value)},reject:error=>{clearTimeout(timer);reject(error)}});
    socket.send(JSON.stringify({id,method,params}));
  })}
  async function evaluate(expression){
    const result=await rpc('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;
  }
  try{
    let port;
    for(let i=0;i<150&&!port;i++){
      try{port=Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0])}catch{}
      if(!port)await sleep(200);
    }
    if(!port)throw Error('Chrome did not start');
    const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    socket=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
    socket.addEventListener('message',event=>{
      const message=JSON.parse(event.data),p=message.params;
      if(message.id){const callback=pending.get(message.id);pending.delete(message.id);if(callback)message.error?callback.reject(Error(JSON.stringify(message.error))):callback.resolve(message.result);return;}
      if(message.method==='Runtime.exceptionThrown')errors.push(p.exceptionDetails.text);
      if(message.method==='Network.requestWillBeSent'){
        if(p.redirectResponse){const previous=active.get(p.requestId);if(previous){previous.status=p.redirectResponse.status;previous.redirect=true;previous.bytes=p.redirectResponse.encodedDataLength||0;}}
        const record={id:p.requestId,url:p.request.url,type:p.type,start:p.timestamp,initiator:p.initiator.type,preload:!!p.request.isLinkPreload,priority:p.request.initialPriority};
        records.push(record);active.set(p.requestId,record);
      }
      if(message.method==='Network.responseReceived'){
        const record=active.get(p.requestId);if(record)Object.assign(record,{status:p.response.status,mime:p.response.mimeType,protocol:p.response.protocol,
          headers:selectedHeaders(p.response.headers),diskCache:!!p.response.fromDiskCache,serviceWorker:!!p.response.fromServiceWorker,timing:p.response.timing});
      }
      if(message.method==='Network.requestServedFromCache'){const record=active.get(p.requestId);if(record)record.browserCache=true;}
      if(message.method==='Network.loadingFinished'){const record=active.get(p.requestId);if(record){record.bytes=p.encodedDataLength;record.end=p.timestamp;}}
      if(message.method==='Network.loadingFailed'){const record=active.get(p.requestId);if(record)record.failure=p.errorText;}
    });
    await rpc('Page.enable');await rpc('Network.enable');await rpc('Runtime.enable');
    await rpc('Emulation.setDeviceMetricsOverride',{width:412,height:823,deviceScaleFactor:1.75,mobile:true});
    await rpc('Emulation.setTouchEmulationEnabled',{enabled:true});
    await rpc('Emulation.setCPUThrottlingRate',{rate:4});
    await rpc('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1638.4*1024/8,uploadThroughput:750*1024/8});
    await rpc('Network.clearBrowserCache');
    await rpc('Page.addScriptToEvaluateOnNewDocument',{source:`window.__lcp=[];new PerformanceObserver(list=>list.getEntries().forEach(e=>window.__lcp.push({start:e.startTime,size:e.size,url:e.url,element:e.element?.tagName,id:e.element?.id,text:e.element?.textContent?.slice(0,100)}))).observe({type:'largest-contentful-paint',buffered:true});`});
    const results=[];
    for(const cache of ['cold','warm']){
      records=[];active=new Map();errors=[];
      const nav=await rpc('Page.navigate',{url});if(nav.errorText)throw Error(nav.errorText);
      for(let i=0;i<300;i++){
        if(await evaluate("document.readyState==='complete'&&document.body.classList.contains('sales-page')&&!!window.Caderninho3D"))break;
        await sleep(200);
      }
      await evaluate('document.fonts.ready.then(()=>true)');await sleep(5000);
      const page=await evaluate(`({url:location.href,navigation:performance.getEntriesByType('navigation')[0].toJSON(),
        lcp:window.__lcp,landscape:document.querySelector('.hero-landscape').currentSrc,
        resources:performance.getEntriesByType('resource').map(e=>({url:e.name,initiator:e.initiatorType,start:e.startTime,end:e.responseEnd,transfer:e.transferSize,encoded:e.encodedBodySize,decoded:e.decodedBodySize})),
        fonts:['Inter Tight','Manrope'].map(f=>({name:f,loaded:document.fonts.check('700 16px "'+f+'"')})),
        preloads:[...document.querySelectorAll('link[rel=preload]')].map(e=>({href:e.href,as:e.as,srcset:e.imageSrcset,sizes:e.imageSizes,priority:e.fetchPriority})),
        broken:[...document.images].filter(e=>e.getClientRects().length&&e.complete&&!e.naturalWidth).map(e=>e.currentSrc||e.src)})`);
      const duplicates=Object.entries(Object.groupBy(records.filter(r=>!r.redirect),r=>r.url)).filter(([,items])=>items.length>1).map(([url,items])=>({url,count:items.length,bytes:items.reduce((sum,r)=>sum+(r.bytes||0),0)}));
      const first=records.find(r=>r.type==='Document')?.start||records[0]?.start||0;
      const result={label,cache,url,settings:{width:412,height:823,dpr:1.75,cpu:4,latencyMs:150,downloadKbps:1638.4,waitAfterLoadMs:5000},
        count:records.length,bytes:records.reduce((sum,r)=>sum+(r.bytes||0),0),duplicates,
        failures:records.filter(r=>r.status>=400||r.failure),redirects:records.filter(r=>r.redirect),errors,page,
        records:records.map(r=>({...r,startMs:(r.start-first)*1000,endMs:r.end?(r.end-first)*1000:null}))};
      results.push(result);
      const shot=await rpc('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,`${label}-${cache}.png`),Buffer.from(shot.data,'base64'));
      console.log('NETWORK '+JSON.stringify({label,cache,count:result.count,bytes:result.bytes,duplicates:duplicates.length,failures:result.failures.length,redirects:result.redirects.length,lcp:page.lcp.at(-1),fonts:page.fonts}));
    }
    // Desktop appearance is checked after the mobile measurements, without adding to their totals.
    await rpc('Emulation.setCPUThrottlingRate',{rate:1});
    await rpc('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    await rpc('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await sleep(1500);
    const desktop=await rpc('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,`${label}-desktop.png`),Buffer.from(desktop.data,'base64'));
    return results;
  }finally{if(socket){try{await rpc('Browser.close')}catch{}socket.close()}else chrome.kill();}
}
async function headers(){
  const paths={html:'',hero:'assets/images/brasil-aquarela-1024.webp',css:'assets/design_system.css',js:null,font:'assets/fonts/inter-tight-latin.woff2',favicon:'favicon.svg',ogImage:'assets/images/og-image.jpg'};
  const output=[];
  for(const [label,base] of Object.entries(urls)){
    const html=await(await fetch(base)).text();
    const js=html.match(/<script src="(assets\/min\/design_system\.js[^\"]*)"/)?.[1];if(!js)throw Error('Minified script URL missing');
    for(const [kind,relative] of Object.entries({...paths,js})){
      const url=new URL(relative,base).href;
      const raw=execFileSync('curl.exe',['--head','--silent','--show-error','--max-time','25','-H','Accept-Encoding: gzip, deflate, br, zstd',url],{encoding:'utf8',windowsHide:true});
      fs.writeFileSync(path.join(out,`${label}-${kind}-headers.txt`),raw);
      const lines=raw.trim().split(/\r?\n/),values={};
      for(const line of lines){const index=line.indexOf(':');if(index>0)values[line.slice(0,index).toLowerCase()]=line.slice(index+1).trim();}
      const response=await fetch(url,{headers:{'Accept-Encoding':'gzip, deflate, br, zstd'}});
      const body=Buffer.from(await response.arrayBuffer());
      output.push({label,kind,url,status:response.status,headStatus:lines[0],headers:selectedHeaders(values),decodedBytes:body.length,sha256:crypto.createHash('sha256').update(body).digest('hex')});
    }
  }
  const redirects=[];
  for(const url of ['https://l.fluenti.com.br/caderninho','http://l.fluenti.com.br/caderninho/','http://caderninho-marcia.vercel.app/']){
    const response=await fetch(url,{method:'HEAD',redirect:'manual'});redirects.push({url,status:response.status,location:response.headers.get('location')});
  }
  return {resources:output,redirects};
}
(async()=>{
  const network=[];for(const [label,url] of Object.entries(urls))network.push(...await waterfall(label,url));
  const http=await headers();
  fs.writeFileSync(path.join(out,'network.json'),JSON.stringify({measuredAt:new Date().toISOString(),network,http},null,2)+'\n');
  console.log('HEADERS '+JSON.stringify(http));
})().catch(error=>{console.error(error);process.exitCode=1});
