/* Browser regression for mobile FAQ geometry, touch, reduced motion and detail scroll poses.
   npm run build && node assets/qa/verify-faq-browser.cjs (Node 22+ and Chrome).
   QA_PAGE_URL optionally checks the deployed page; CHROME_PATH overrides the Chrome binary.
   Screenshots/profiles/results stay in the ignored assets/qa/runtime/faq/ directory. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=path.resolve('dist'),out=path.resolve('assets/qa/runtime/faq');const sleep=ms=>new Promise(r=>setTimeout(r,ms));let server,chrome,ws,id=0;const pending=new Map(),errors=[],results=[];
function rpc(method,params={}){return new Promise((resolve,reject)=>{const key=++id;const timeout=setTimeout(()=>{pending.delete(key);reject(Error('CDP timeout: '+method))},20000);pending.set(key,{resolve:value=>{clearTimeout(timeout);resolve(value)},reject:error=>{clearTimeout(timeout);reject(error)}});ws.send(JSON.stringify({id:key,method,params}))})}
async function evaluate(expression){const r=await rpc('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'};
 server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/caderninho\//,'/'));if(file===root)file=path.join(root,'index.html');if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const profile=path.join(out,'chrome-'+Date.now());chrome=spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});for(let i=0;i<100&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++)await sleep(100);await sleep(300);const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);else if(m.method==='Network.responseReceived'&&m.params.response.status>=400)errors.push(m.params.response.url)});
 await rpc('Page.enable');await rpc('Runtime.enable');await rpc('Network.enable');

 // Run after npm run build. --baseline records the faulty geometry without asserting it.
 const baseline=process.argv.includes('--baseline');
 const url=process.env.QA_PAGE_URL || base+'/caderninho/';
 async function screenshot(name){
   const shot=await rpc('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(shot.data,'base64'));
 }
 for(const [width,height] of [[390,844],[360,740],[1440,900]]){
   errors.length=0;
   await rpc('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<720});
   await rpc('Emulation.setTouchEmulationEnabled',{enabled:width<720});
   await rpc('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
   const navigation=await rpc('Page.navigate',{url});assert.ok(!navigation.errorText,navigation.errorText);
   for(let i=0;i<150;i++){
     if(await evaluate("document.readyState==='complete'&&document.querySelector('[data-faq].disclosure-ready')"))break;
     await sleep(100);
   }
   await evaluate('document.fonts.ready.then(()=>true)');
   // Scroll in viewport-sized steps so lazy sections and reveals run as on a phone.
   for(let step=0;step<100;step++){
     const position=await evaluate('({y:scrollY,bottom:document.documentElement.scrollHeight-innerHeight})');
     if(position.y>=position.bottom-2)break;
     await evaluate('scrollBy({top:innerHeight*.65,behavior:"instant"})');await sleep(120);
   }
   await evaluate("document.querySelector('[data-faq]').scrollIntoView({block:'start',behavior:'instant'})");await sleep(1000);
   const geometry=await evaluate(`(()=>{
     const faq=document.querySelector('[data-faq]'),g=faq.getBoundingClientRect();
     return {width:innerWidth,rows:[...faq.querySelectorAll('.detail-item')].map(row=>{
       const r=row.getBoundingClientRect(),button=row.querySelector('button'),b=button.getBoundingClientRect();
       return {id:button.id,top:r.top,height:r.height,minHeight:getComputedStyle(row).minHeight,buttonHeight:b.height,buttonWidth:b.width,expanded:button.getAttribute('aria-expanded')};
     }),height:g.height,opacity:getComputedStyle(faq).opacity,scrollWidth:document.documentElement.scrollWidth};
   })()`);
   await screenshot((baseline?'before':'after')+'-'+width+'-faq');
   if(!baseline){
     assert.equal(geometry.rows.length,6);assert.equal(geometry.opacity,'1');assert.ok(geometry.scrollWidth<=width);
     geometry.rows.forEach((row,index)=>{
       assert.ok(row.buttonHeight>=48,row.id+' touch target');
       assert.ok(row.buttonWidth>=width*(width<720?.8:.3),row.id+' whole row target');
       assert.equal(parseFloat(row.minHeight)||0,0,row.id+' leaked viewport height');
       if(row.expanded==='false')assert.ok(row.height<height*.25,row.id+' not compact');
       if(index>0)assert.ok(Math.abs(row.top-geometry.rows[index-1].top-geometry.rows[index-1].height)<2,'unexpected row gap');
     });
     // Close all answers, then open/close each using real touch/mouse input.
     await evaluate("document.querySelectorAll('[data-faq] button[aria-expanded=true]').forEach(b=>b.click())");await sleep(400);
     for(let index=0;index<6;index++){
       const box=await evaluate(`(()=>{const b=document.querySelectorAll('[data-faq] button')[${index}];b.scrollIntoView({block:'center',behavior:'instant'});const r=b.getBoundingClientRect();return {x:r.left+r.width*.75,y:r.top+r.height/2,scroll:scrollY}})()`);
       async function press(){
         if(width<720){await rpc('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x,y:box.y}]});await rpc('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
         else{await rpc('Input.dispatchMouseEvent',{type:'mousePressed',x:box.x,y:box.y,button:'left',clickCount:1});await rpc('Input.dispatchMouseEvent',{type:'mouseReleased',x:box.x,y:box.y,button:'left',clickCount:1});}
       }
       await press();await sleep(450);
       const open=await evaluate(`(()=>{const buttons=[...document.querySelectorAll('[data-faq] button')],b=buttons[${index}],panel=document.getElementById(b.getAttribute('aria-controls'));return {open:b.getAttribute('aria-expanded'),count:buttons.filter(b=>b.getAttribute('aria-expanded')==='true').length,panel:panel.getBoundingClientRect().height,inert:panel.hasAttribute('inert'),scroll:scrollY}})()`);
       assert.equal(open.open,'true');assert.equal(open.count,1);assert.ok(open.panel>20);assert.equal(open.inert,false);
       assert.ok(Math.abs(open.scroll-box.scroll)<3,'opening shifts scroll');
       await press();await sleep(400);
       assert.equal(await evaluate(`document.querySelectorAll('[data-faq] button')[${index}].getAttribute('aria-expanded')`),'false');
     }
     if(width>=720){
       await evaluate("document.querySelector('#compra-pergunta-03').focus()");
       assert.equal(await evaluate("document.activeElement.id"),'compra-pergunta-03');
       for(const expected of ['true','false']){
         await rpc('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});
         await rpc('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await sleep(400);
         assert.equal(await evaluate("document.querySelector('#compra-pergunta-03').getAttribute('aria-expanded')"),expected,'keyboard disclosure');
       }
     }
     // Preserve the sticky notebook and all five scroll poses only in #detalhes.
     if(width<720){
       for(let index=0;index<5;index++){
         const expected=await evaluate(`(()=>{const row=document.querySelectorAll('#detalhes [data-detail]')[${index}],stage=document.querySelector('#detalhes .details-stage'),fixed=stage.getBoundingClientRect().height,free=innerHeight-fixed;scrollTo({top:row.getBoundingClientRect().top+scrollY-fixed-free*.4+5,behavior:'instant'});return row.dataset.detail})()`);
         await sleep(500);
         assert.equal(await evaluate("document.querySelector('#detalhes .details-stage').dataset.activeDetail"),expected,'details scroll selection');
       }
       assert.equal(await evaluate("getComputedStyle(document.querySelector('#detalhes .details-stage')).position"),'sticky');
       // Reduced motion must not force every FAQ answer open via a shared class.
       await rpc('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await sleep(250);
       await evaluate("document.querySelector('#compra-pergunta-02').click();document.querySelector('[data-faq]').scrollIntoView({block:'start',behavior:'instant'})");await sleep(250);
       const reduced=await evaluate("[...document.querySelectorAll('[data-faq] .detail-description')].map(p=>({height:p.getBoundingClientRect().height,expanded:p.getAttribute('aria-hidden')}))");
       reduced.forEach(panel=>assert.ok(panel.expanded==='true'?panel.height===0:panel.height>20));
       await rpc('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
       await evaluate("document.querySelector('[data-faq]').removeAttribute('data-revealed')");
       assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-faq]')).opacity"),'1','visible when reveal never fires');
       await evaluate("document.documentElement.classList.add('motion-paused');document.querySelector('[data-faq]').dataset.revealed='true'");
       assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-faq]')).opacity"),'1','visible when motion is paused');
       await evaluate("document.documentElement.classList.remove('motion-paused')");
     }
     for(const section of ['para-que','oferta','chamada-final']){
       await evaluate(`document.getElementById('${section}').scrollIntoView({block:'start',behavior:'instant'})`);await sleep(1000);
       await screenshot('after-'+width+'-'+section);
     }
     assert.deepEqual(errors,[]);
   }
   results.push(geometry);console.log(baseline?'BASELINE':'PASS FAQ browser',JSON.stringify(geometry));
 }
 fs.writeFileSync(path.join(out,baseline?'baseline.json':'results.json'),JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{
 if(ws){try{await rpc('Browser.close')}catch{}ws.close()}else chrome?.kill();server?.close();
});
