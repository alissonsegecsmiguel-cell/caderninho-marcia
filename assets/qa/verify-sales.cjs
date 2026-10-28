/* Sales content and shared-runtime regression checks. No browser rendering. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {parseHTML} = require('./runtime/node_modules/linkedom');
const project = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(project, 'index.html'), 'utf8');
const runtime = fs.readFileSync(path.join(project, 'assets/design_system.js'), 'utf8');
const notebookRuntime = fs.readFileSync(path.join(project, 'assets/pagina.js'), 'utf8');
const ids = ['inicio','para-que','detalhes','oferta','perguntas','chamada-final'];
const report = [];
const check = (label, action) => { action(); report.push(`PASS ${label}`); };

function load({link, contact, price, reduced=false, precise=false, extraButton=false, withObserver=true, hidden=false, mobile=true, layout={hero:{top:0,bottom:960},closing:{top:6800,bottom:7800}}}={}) {
  const {document, window} = parseHTML(source);
  Object.defineProperty(document,'hidden',{value:hidden,configurable:true});
  Object.defineProperty(document,'activeElement',{value:document.body,writable:true,configurable:true});
  Object.defineProperty(window,'innerHeight',{value:844,writable:true,configurable:true});
  document.getElementById('inicio').getBoundingClientRect=()=>layout.hero;
  document.getElementById('chamada-final').getBoundingClientRect=()=>layout.closing;
  Object.defineProperty(document.querySelector('[data-mobile-purchase]'),'offsetHeight',{get(){return this.hidden?0:80;}});
  const observers=[];
  class Observer { constructor(cb) { this.cb=cb;this.targets=[];observers.push(this); } observe(el) { this.targets.push(el); } unobserve() {} disconnect() {} }
  if(withObserver)window.IntersectionObserver=Observer;
  else delete window.IntersectionObserver;
  const media={matches:reduced,listeners:[],addEventListener(type,listener) { if(type==='change')this.listeners.push(listener); }};
  const mobileMedia={matches:mobile,listeners:[],addEventListener(type,listener) { if(type==='change')this.listeners.push(listener); }};
  const matchMedia=q=>q.includes('pointer:fine')?{matches:precise}:q.replace(/\s/g,'').includes('max-width:720px')?mobileMedia:media;
  window.matchMedia=matchMedia;
  const timers=new Map();let now=0,nextTimer=0,frameClock=0;
  const advance=ms=>{const end=now+ms;for(let steps=0;steps<1000;steps++){
    const next=[...timers.entries()].filter(([,timer])=>timer.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];
    if(!next)break;timers.delete(next[0]);now=next[1].time;next[1].callback();
  }now=end;};
  const context=vm.createContext({document,window,URL,HTMLElement:window.HTMLElement,
    navigator:{},IntersectionObserver:Observer,matchMedia,
    requestAnimationFrame:cb=>cb(),addEventListener:window.addEventListener.bind(window),
    innerWidth:390,innerHeight:844,scrollY:0,
    setTimeout:(callback,delay=0)=>{const id=++nextTimer;timers.set(id,{callback,time:now+delay});return id;},
    // requestAnimationFrame roda na hora; cada leitura de performance.now avança um quadro (16 ms).
    clearTimeout:id=>timers.delete(id),performance:{now:()=>(frameClock+=16)},console});
  vm.runInContext(runtime,context,{filename:'design_system.js'});
  if(extraButton)document.querySelector('footer').insertAdjacentHTML('beforeend','<a data-compra><span data-preco></span></a>');
  let config=[...document.querySelectorAll('script:not([src])')][0].textContent;
  if(link)config=config.replace(/const LINK_COMPRA = "[^"]+";/,`const LINK_COMPRA = ${JSON.stringify(link)};`);
  if(contact!==undefined)config=config.replace(/const LINK_CONTATO = "[^"]+";/,`const LINK_CONTATO = ${JSON.stringify(contact)};`);
  if(price)config=config.replace('R$ 65,44',price);
  vm.runInContext(config,context,{filename:'index.html:purchase-config'});
  vm.runInContext(notebookRuntime,context,{filename:'pagina.js'});
  // As dobras abaixo da primeira inicializam depois do load, como no navegador.
  window.dispatchEvent(new window.Event('load'));advance(1);
  return {document,window,observers,media,mobileMedia,layout,advance,timers};
}
function mountBooks(loaded){
  const pending=loaded.document.getElementById('caderno-detalhes');
  const nearby=loaded.observers.find(item=>item.targets.includes(pending));
  if(nearby)nearby.cb(nearby.targets.filter(el=>el.hasAttribute('data-caderno')).map(target=>({target,isIntersecting:true})));
  return loaded;
}
const page=mountBooks(load());
const $=selector=>page.document.querySelector(selector);
const $$=selector=>[...page.document.querySelectorAll(selector)];

check('All six sections are complete, remain in order and have valid headings',()=>{
  const sections=$$('main > section');
  assert.deepEqual(sections.map(el=>el.id),ids);
  sections.forEach(section=>{
    const title=page.document.getElementById(section.getAttribute('aria-labelledby'));
    assert.ok(title?.matches('h1,h2'));
    assert.ok(section.querySelectorAll('[data-reveal]').length>0);
  });
  assert.equal($$('h1').length,1);
  assert.equal(page.document.title,'Caderninho na Mão! | Profa. Marcia Macedo');
  assert.deepEqual($$('main .sec-rule > span:first-child').map(el=>el.textContent),['02 / O CADERNO POR DENTRO','03 / DETALHES','05 / PERGUNTAS']);
  assert.equal($('#oferta .oferta-pilula').textContent,'04 / A OFERTA');
  for(const property of ['og:title','og:description','og:image','og:url','og:image:alt'])assert.ok($(`meta[property="${property}"]`)?.getAttribute('content'),property);
  assert.equal($('meta[property="og:image"]').getAttribute('content'),'https://l.fluenti.com.br/caderninho/assets/images/og-image.jpg');
  assert.equal($('meta[name="twitter:card"]').getAttribute('content'),'summary_large_image');
  assert.equal($('link[rel="canonical"]').getAttribute('href'),'https://l.fluenti.com.br/caderninho/');
  assert.ok($('meta[name="description"]').getAttribute('content').includes('Envio para o Brasil e para o exterior.'));
  assert.ok(fs.existsSync(path.join(project,'404.html')));
});
check('Product showcase keeps the requested copy, purchase configuration and five real annotated pages',()=>{
  assert.ok($('#para-que.section.ds-group.section-cream'));
  assert.deepEqual($$('#para-que .sec-rule span').map(el=>el.textContent),['02 / O CADERNO POR DENTRO','UM CADERNO, MUITOS USOS']);
  assert.equal($('#para-que-titulo').textContent,'Tudo o que você aprende, num só lugar.');
  assert.equal($('#para-que-titulo .lettering-transparent').textContent,'num só lugar.');
  assert.equal($('#para-que .vitrine-copy p').textContent,'Use o caderninho nas aulas, nos estudos em casa ou quando ouvir uma palavra nova numa música, num filme ou numa conversa. Anote o vocabulário, pratique a escrita, guarde as dúvidas para a próxima aula e revise tudo quando quiser.');
  assert.equal($('#para-que .vitrine-photo img').getAttribute('src'),'assets/images/mao-caderno.jpg');
  assert.equal($('#para-que [data-preco]').textContent,'R$ 65,44');
  assert.equal($('#para-que a[href="#detalhes"]').textContent,'Ver todos os detalhes do caderno ↓');
  assert.deepEqual($$('#para-que .vitrine-prices tr').map(el=>[...el.children].map(cell=>cell.textContent)),[
    ['Caderninho na Mão!','R$ 65,44'],['Frete','Calculado no carrinho'],['Entrega','No Brasil e no exterior']
  ]);
  assert.deepEqual($$('[data-note-slide]').map(slide=>[...slide.querySelectorAll('.note-writing p')].map(p=>p.textContent)),[
    ['saudade · /sawˈda.dʒi/ · substantivo','A falta que a gente sente de alguém, de um lugar ou de um momento.','"Que saudade das nossas aulas!"'],
    ['cafuné · /ka.fuˈnɛ/ · substantivo','Carinho que a gente faz passando a mão, de leve, nos cabelos de alguém.','"Tem palavras que parecem um abraço."'],
    ['Eu moro em Buenos Aires.','Eu gosto de café com leite.','Amanhã eu vou à praia com meus amigos.'],
    ['Perguntar na aula:','Qual a diferença entre "por" e "para"?','Quando eu uso "a gente" no lugar de "nós"?'],
    ['Palavras da semana: saudade, cafuné, cheiro, abraço, sobremesa.','Já sei usar 4 de 5! ✓']
  ]);
  assert.deepEqual($$('.note-label').map(el=>el.textContent),['VOCABULÁRIO','VOCABULÁRIO','ESCRITA','DÚVIDAS','REVISÃO']);
  for(const img of $$('.note-paper > img'))assert.equal(img.getAttribute('src'),'assets/images/miolo.png');
});
check('Carousel arrows and keyboard update one accessible slide, wrap around and announce position',()=>{
  const active=load();const doc=active.document;
  const position=()=>doc.querySelector('[data-note-position]').textContent;
  const next=doc.querySelector('[data-note-next]'),prev=doc.querySelector('[data-note-prev]');
  assert.equal(doc.querySelector('[data-notes-controls]').hidden,false);
  next.click();assert.equal(position(),'02 / 05');
  assert.equal(doc.querySelectorAll('[data-note-slide][aria-hidden="false"]').length,1);
  assert.equal(doc.querySelectorAll('[data-note-slide]:not([inert])').length,1);
  prev.click();prev.click();assert.equal(position(),'05 / 05');
  const key=key=>{const event=Object.assign(new active.window.Event('keydown',{bubbles:true,cancelable:true}),{key});doc.querySelector('.notes-viewport').dispatchEvent(event);assert.equal(event.defaultPrevented,true);};
  key('Home');assert.equal(position(),'01 / 05');key('End');assert.equal(position(),'05 / 05');key('ArrowLeft');assert.equal(position(),'04 / 05');
  assert.ok(doc.querySelector('[data-note-announcement]').textContent.includes('DÚVIDAS'));
});
check('Horizontal drag advances pages; vertical scroll, cancellation and small drags do not',()=>{
  const active=load();const viewport=active.document.querySelector('.notes-viewport');
  const position=()=>active.document.querySelector('[data-note-position]').textContent;
  const pointer=(type,x,y)=>viewport.dispatchEvent(Object.assign(new active.window.Event(type,{bubbles:true}),{pointerId:1,pointerType:'touch',isPrimary:true,clientX:x,clientY:y}));
  pointer('pointerdown',240,100);pointer('pointermove',120,105);
  assert.ok(active.document.querySelector('.notes-carousel').classList.contains('is-dragging'));
  pointer('pointerup',120,105);assert.equal(position(),'02 / 05');
  pointer('pointerdown',120,100);pointer('pointermove',125,240);pointer('pointerup',125,240);assert.equal(position(),'02 / 05');
  pointer('pointerdown',240,100);pointer('pointermove',120,105);pointer('pointercancel',120,105);assert.equal(position(),'02 / 05');
  pointer('pointerdown',240,100);pointer('pointerup',225,100);assert.equal(position(),'02 / 05');
});
check('Decorative parallax stays bounded, hides missing images and resets with reduced motion while carousel remains usable',()=>{
  const active=load();const section=active.document.getElementById('para-que');
  section.getBoundingClientRect=()=>({top:-200,height:1000});
  const observer=active.observers.find(item=>item.targets.length===1&&item.targets[0]===section);
  assert.ok(observer);observer.cb([{target:section,isIntersecting:true}]);
  const objects=[...section.querySelectorAll('[data-vitrine-object]')];assert.equal(objects.length,4);
  for(const object of objects){const offset=parseFloat(object.style.getPropertyValue('--object-y'));assert.ok(Number.isFinite(offset)&&Math.abs(offset)<=10);}
  objects[0].querySelector('img').dispatchEvent(new active.window.Event('error'));assert.equal(objects[0].hidden,true);
  active.media.matches=true;active.media.listeners.forEach(listener=>listener({matches:true}));
  for(const object of objects)assert.ok(!object.style.getPropertyValue('--object-y'));
  section.querySelector('[data-note-next]').click();assert.equal(section.querySelector('[data-note-position]').textContent,'02 / 05');
});
check('Removed folds are absent and all remaining in-page links resolve',()=>{
  assert.equal($('#a-frase'),null);
  assert.equal($('#como-comprar'),null);
  assert.equal($('[data-passos]'),null);
  assert.equal($('[data-postais]'),null);
  assert.equal($('.hero-bottom .scroll-cue').getAttribute('href'),'#para-que');
  assert.equal($('.hero-bottom .scroll-cue').textContent,'O caderno por dentro ↓');
  const {document}=parseHTML(source);
  for(const link of document.querySelectorAll('a[href^="#"]')){
    const target=link.getAttribute('href').slice(1);
    assert.ok(target&&document.getElementById(target),'Missing anchor: '+target);
  }
  for(const button of document.querySelectorAll('[data-compra]'))assert.equal(button.getAttribute('href'),'#oferta');
});
check('Hero copy, lowercase transparent lettering, Brazilian flag and purchase label match the request',()=>{
  assert.equal($('#inicio .hero-discord-pill').textContent,'O caderno oficial das aulas da Profa. Marcia Macedo');
  assert.ok($('#inicio .mini-flag'));
  assert.equal($('#inicio-titulo').childNodes[0].textContent,'Caderninho');
  assert.ok($('#inicio-titulo > br'));
  assert.equal($('#inicio-titulo .lettering-transparent').textContent,'na mão!');
  assert.equal($('#inicio .lead').textContent,'Para anotar, praticar e revisar sempre que precisar. Caderno com 100 folhas.');
  assert.equal($('#inicio a[data-compra]').textContent.trim(),'Compre aqui');
  assert.equal($('.hero-purchase-note').textContent,'Envio para o Brasil e para o exterior');
  assert.equal($('#inicio [data-preco]'),null);
});
check('Hero retains catalogue composition with Rio behind the notebook, decorative flag, leaves and a continuous word strip',()=>{
  const reference=parseHTML(fs.readFileSync(path.join(project,'assets/design_system.html'),'utf8')).document;
  for(const selector of ['.hero','.hero-glow.bloom[data-ds-bloom]','.hero-grid','.hero-copy','.hero-discord-pill','.display','.lettering-transparent','.lead','.hero-actions','.hero-art','.postmark','.handwritten','.annot.coord','.hero-bottom']){
    const original=reference.querySelector('#inicio '+selector)||reference.querySelector(selector);
    const actual=$('#inicio '+selector)||$(selector);
    assert.ok(actual,selector);
    for(const className of original.classList)assert.ok(actual.classList.contains(className),selector+' '+className);
  }
  assert.equal($('#inicio .hero-art .ds-window'),null);
  const landscape=$('#inicio > .hero-backdrop img.hero-landscape');
  assert.equal(landscape.getAttribute('src'),'assets/images/brasil-aquarela.png');
  assert.equal(landscape.getAttribute('fetchpriority'),'high');
  assert.ok($('#inicio > .hero-backdrop .hero-landscape-vivid'));
  assert.ok(landscape.closest('picture').querySelector('source[type="image/webp"]').getAttribute('srcset').includes('brasil-aquarela-640.webp'));
  assert.ok($('#inicio .hero-art > .caderno-3d[data-caderno]'));
  assert.ok($('#inicio > .hero-art'));
  assert.equal($$('#inicio .hero-copy .hero-flag[aria-hidden="true"] .flag-wash').length,2);
  assert.ok($('#inicio .hero-flag .flag-orb'));
  assert.equal($$('#inicio img.hero-tropical[aria-hidden="true"][alt=""]').length,2);
  assert.equal($('#inicio .handwritten').childNodes[0].textContent,'Caderninho na mão!');
  assert.ok($('#inicio .hero-actions .btn.btn-gold.btn-compra.magnetic .arrow .icon'));
  assert.equal($$('#inicio .side-rail[aria-hidden="true"]').length,2);
  assert.equal($('#inicio').nextElementSibling.className,'wire');
  assert.deepEqual($$('.wire-track > span').map(el=>el.textContent),Array(2).fill('Anote ✳ Pratique ✳ Revise ✳ Caderninho na mão ✳ Feito para os alunos da Profa. Marcia ✳'));
  assert.equal($('.wire-track > span:last-child').getAttribute('aria-hidden'),'true');
  const ids=$$('[id]').map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
  for(const el of $$('textPath[href^="#"]'))assert.ok(page.document.getElementById(el.getAttribute('href').slice(1)));
  const heroReveal=$$('#inicio [data-reveal]');
  assert.deepEqual(heroReveal.map(el=>el.style.getPropertyValue('--reveal-delay')),['0ms','80ms','160ms','240ms','320ms','400ms','480ms']);
});
check('Shared CSS, JS, fonts and images use relative paths at the root and under /caderninho/',()=>{
  assert.ok($('link[href="assets/design_system.css"]'));
  assert.ok($('link[href="assets/pagina.css"]'));
  assert.ok($('script[src="assets/design_system.js"]'));
  assert.ok($('script[src="assets/pagina.js"]'));
  for(const el of $$('link[href],img[src],script[src]')){
    const ref=el.getAttribute('href')||el.getAttribute('src');
    if(/^https?:/.test(ref))continue;
    assert.ok(!ref.startsWith('/'),ref);
    assert.ok(fs.existsSync(path.join(project,decodeURIComponent(ref))),ref);
  }
  for(const el of $$('source[srcset],link[imagesrcset]'))for(const candidate of (el.getAttribute('srcset')||el.getAttribute('imagesrcset')).split(',')){
    const ref=candidate.trim().split(/\s+/)[0];assert.ok(!ref.startsWith('/'),ref);assert.ok(fs.existsSync(path.join(project,ref)),ref);
  }
  for(const stylesheet of $$('link[rel="stylesheet"]')){
    const file=path.join(project,stylesheet.getAttribute('href'));
    // Comentários ficam de fora: o CSS guarda, comentado, o fundo futuro da oferta.
    for(const [,ref] of fs.readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/url\("([^"\n]+)"\)/g)){
      if(!ref.startsWith('data:')){assert.ok(!ref.startsWith('/'),ref);assert.ok(fs.existsSync(path.resolve(path.dirname(file),ref)),ref);}
    }
  }
  assert.equal($$('video').length,0);assert.equal($$('source:not([type="image/webp"])').length,0);
  assert.equal(source.includes('caderno-abrindo.mp4'),false);
});
check('Official metadata and host-scoped Vercel routes preserve the original root and cache rules',()=>{
  const official='https://l.fluenti.com.br/caderninho/';
  assert.equal($('meta[property="og:url"]').getAttribute('content'),official);
  assert.equal($('meta[name="twitter:image"]').getAttribute('content'),official+'assets/images/og-image.jpg');
  const config=JSON.parse(fs.readFileSync(path.join(project,'vercel.json'),'utf8'));
  assert.equal(config.buildCommand,'npm run build');assert.equal(config.outputDirectory,'dist');
  assert.equal(config.trailingSlash,undefined);
  const host=[{type:'host',value:'l.fluenti.com.br'}];
  assert.deepEqual(config.redirects,[
    {source:'/caderninho',has:host,destination:'/caderninho/',permanent:true},
    {source:'/',has:host,destination:'https://fluenti.com.br',permanent:false}
  ]);
  assert.deepEqual(config.rewrites,[
    {source:'/caderninho/',has:host,destination:'/index.html'},
    {source:'/caderninho/:path*',has:host,destination:'/:path*'}
  ]);
  for(const [folder,cache] of [['fonts','public, max-age=31536000, immutable'],['min','public, max-age=31536000, immutable'],['images','public, max-age=2592000, stale-while-revalidate=86400']]){
    const original=config.headers.find(rule=>rule.source===`/assets/${folder}/(.*)`);
    assert.deepEqual(original.headers,[{key:'Cache-Control',value:cache}]);
    const nested=config.headers.find(rule=>rule.source===`/caderninho/assets/${folder}/(.*)`);
    assert.deepEqual(nested.has,host);assert.deepEqual(nested.headers,original.headers);
  }
});
check('Only brand and purchase action in the header; requested footer and shared tricolor',()=>{
  const header=$('header .nav-inner');
  assert.equal(header.children.length,2);
  assert.ok(header.children[0].classList.contains('brand'));
  assert.equal(header.children[0].textContent.trim(),'marcia macedo');
  assert.equal(header.querySelector('.brand img'),null);
  assert.ok(header.children[1].hasAttribute('data-compra'));
  assert.equal(header.querySelector('[data-preco]'),null);
  assert.equal(header.children[1].textContent.trim(),'Compre aqui');
  assert.ok($('footer').textContent.includes('PORTUGUÊS COM ALMA BRASILEIRA'));
  assert.equal($$('.footer-tricolor > i').length,3);
});
check('Shared glow and magnetic handlers work without catalogue elements, honor reduced motion and pause offscreen animation',()=>{
  const active=load({precise:true});
  const glow=active.document.querySelector('.hero-glow');
  const button=active.document.querySelector('#inicio .magnetic');
  const pointer=(x,y)=>Object.assign(new active.window.Event('pointermove',{bubbles:true}),{clientX:x,clientY:y});
  button.getBoundingClientRect=()=>({left:20,top:30,width:200,height:50});
  active.window.dispatchEvent(pointer(390,844));
  assert.equal(glow.style.getPropertyValue('--bloom-x'),'8.0px');
  assert.equal(glow.style.getPropertyValue('--bloom-y'),'6.0px');
  button.dispatchEvent(pointer(200,70));
  assert.equal(button.style.transform,'translate(3px,-0.8px)');
  button.dispatchEvent(new active.window.Event('pointerleave'));
  assert.ok(!button.style.transform);
  const visibility=active.observers.find(observer=>observer.targets.some(el=>el.classList.contains('wire')));
  const wire=active.document.querySelector('.wire');
  visibility.cb([{target:wire,isIntersecting:false}]);assert.ok(wire.classList.contains('is-offscreen'));
  visibility.cb([{target:wire,isIntersecting:true}]);assert.equal(wire.classList.contains('is-offscreen'),false);
  active.media.matches=true;active.media.listeners.forEach(listener=>listener({matches:true}));
  active.window.dispatchEvent(pointer(390,844));button.dispatchEvent(pointer(200,70));
  assert.ok(!glow.style.getPropertyValue('--bloom-x'));
  assert.ok(!button.style.transform);
});
check('Shared runtime boots without catalogue elements and adds every background/reveal',()=>{
  assert.equal($$('.section-ribbon').length,6);
  assert.equal($$('.section-leaf').length,5);
  assert.equal($$('.svg-sprite').length,1);
  for(const el of $$('use[href^="#"]'))assert.ok(page.document.getElementById(el.getAttribute('href').slice(1)));
  const observer=page.observers[0];observer.cb(observer.targets.map(target=>({target,isIntersecting:true})));
  assert.equal($$('[data-reveal]:not([data-revealed])').length,0);
  page.document.dispatchEvent(Object.assign(new page.window.Event('keydown'),{key:'Escape'}));
});
check('All nine purchase buttons use the configured cart URL in the same tab and allow navigation',()=>{
  assert.equal($('[data-preco]').textContent,'R$ 65,44');
  assert.deepEqual($$('[data-compra]').map(button=>button.closest('section')?.id||(button.closest('header')?'cabecalho':'barra-mobile')),['cabecalho','inicio','para-que','detalhes','oferta','oferta','perguntas','chamada-final','barra-mobile']);
  for(const button of $$('[data-compra]')){
    assert.equal(button.getAttribute('href'),'https://clubedeautores.com.br/livro/caderninho-na-mao-prof-marcia-macedo?cart=true');
    assert.equal(new URL(button.getAttribute('href')).searchParams.get('cart'),'true');
    assert.equal(button.hasAttribute('target'),false);
    assert.equal(button.getAttribute('aria-label').includes('abre em nova aba'),false);
    assert.ok(button.rel.includes('noopener')&&button.rel.includes('noreferrer'));
    assert.equal(button.hasAttribute('aria-disabled'),false);
    assert.equal(button.getAttribute('aria-label').includes('R$ 65,44'),!button.closest('header, #inicio'));
    assert.ok(button.getAttribute('aria-label').startsWith(button.textContent.replace(/\s+/g,' ').trim()));
    const event=new page.window.Event('click',{bubbles:true,cancelable:true});button.dispatchEvent(event);
    assert.equal(event.defaultPrevented,false);
    page.advance(3100);
  }
  const guarded=load();const [first,second]=guarded.document.querySelectorAll('[data-compra]');
  const click=button=>{const event=new guarded.window.Event('click',{bubbles:true,cancelable:true});button.dispatchEvent(event);return event.defaultPrevented;};
  assert.equal(click(first),false);assert.equal(click(second),true);assert.ok(first.classList.contains('is-enviando'));
  guarded.window.dispatchEvent(new guarded.window.Event('pageshow'));assert.equal(first.classList.contains('is-enviando'),false);
  assert.equal(click(second),false);guarded.advance(3100);assert.equal(click(first),false);
  const unconfigured=load({link:'COLAR_AQUI_O_LINK_DO_CLUBE_DE_AUTORES'});
  const button=unconfigured.document.querySelector('[data-compra]');
  const event=new unconfigured.window.Event('click',{bubbles:true,cancelable:true});button.dispatchEvent(event);
  assert.equal(event.defaultPrevented,true);
});
check('Configured URL and changed price apply to every purchase button, including an extra button, in the same tab',()=>{
  const configured=load({link:'https://example.com/caderninho',price:'R$ 70,00',extraButton:true});
  for(const button of configured.document.querySelectorAll('[data-compra]')){
    assert.equal(button.getAttribute('href'),'https://example.com/caderninho');
    assert.equal(button.hasAttribute('target'),false);
    assert.ok(button.rel.includes('noopener')&&button.rel.includes('noreferrer'));
    assert.equal(button.getAttribute('aria-label').includes('R$ 70,00'),!button.closest('header, #inicio'));
    const event=new configured.window.Event('click',{bubbles:true,cancelable:true});button.dispatchEvent(event);
    assert.equal(event.defaultPrevented,false);
    configured.advance(3100);
  }
  for(const element of configured.document.querySelectorAll('[data-preco-valor]'))assert.equal(element.textContent,'70,00');
  for(const element of configured.document.querySelectorAll('[data-preco]'))assert.equal(element.textContent,'R$ 70,00');
});
function intersectBook(loaded,id){
  const element=loaded.document.getElementById(id);
  const observer=loaded.observers.find(item=>item.targets.includes(element));
  assert.ok(observer);observer.cb([{target:element,isIntersecting:true}]);return element;
}
check('One shared 3D template mounts in hero, details, offer and closing with the real cover and inner page',()=>{
  assert.deepEqual($$('[data-caderno]').map(el=>el.id),['caderno-hero','caderno-detalhes','caderno-oferta','caderno-final']);
  for(const element of $$('[data-caderno]')){
    assert.equal(element.getAttribute('role'),'img');assert.ok(element.getAttribute('aria-label'));
    assert.equal(element.querySelectorAll('.caderno-model').length,1);
    assert.equal(element.querySelector('.caderno-page img').getAttribute('src'),'assets/images/miolo.png');
    assert.equal(element.querySelector('.caderno-cover-front img').getAttribute('src'),'assets/images/capa.jpg');
    const back=element.querySelector('[data-caderno-back]');
    assert.equal(back.hidden,element.id!=='caderno-detalhes');
    if(element.id==='caderno-detalhes')assert.equal(back.getAttribute('src'),'assets/images/contra-capa.webp');
    assert.equal(element.querySelector('.caderno-fallback').hidden,true);
  }
});
check('Hero loop stays independent while details waits for interaction without timers',()=>{
  const active=load();
  const details=active.document.getElementById('caderno-detalhes');
  assert.equal(details.dataset.cadernoState,undefined);assert.equal(details.querySelector('.caderno-model'),null);
  mountBooks(active);const hero=intersectBook(active,'caderno-hero');
  assert.equal(hero.dataset.cadernoState,'cycling');assert.equal(details.dataset.cadernoState,'interactive');
  assert.equal(active.timers.size,0);assert.equal(hero.hasAttribute('data-caderno-loop'),true);
  assert.equal(details.hasAttribute('data-caderno-loop'),false);
  assert.equal(details.dataset.cadernoFeature,'01');
  active.advance(30000);assert.equal(hero.dataset.cadernoState,'cycling');assert.equal(details.dataset.cadernoFeature,'01');
});
check('Loop pauses outside the hero and in hidden tabs without resetting; an initially hidden tab starts paused',()=>{
  const active=load();const hero=intersectBook(active,'caderno-hero');
  const section=active.document.getElementById('inicio');
  const visibility=active.observers.find(item=>item.targets.length===1&&item.targets[0]===section);
  assert.ok(visibility);visibility.cb([{target:section,isIntersecting:true}]);
  assert.equal(hero.classList.contains('is-loop-paused'),false);
  visibility.cb([{target:section,isIntersecting:false}]);assert.ok(hero.classList.contains('is-loop-paused'));
  assert.equal(hero.dataset.cadernoState,'cycling');assert.equal(active.timers.size,0);
  Object.defineProperty(active.document,'hidden',{value:true,configurable:true});
  active.document.dispatchEvent(new active.window.Event('visibilitychange'));
  assert.ok(active.document.documentElement.classList.contains('page-hidden'));
  Object.defineProperty(active.document,'hidden',{value:false,configurable:true});
  active.document.dispatchEvent(new active.window.Event('visibilitychange'));
  assert.equal(active.document.documentElement.classList.contains('page-hidden'),false);
  visibility.cb([{target:section,isIntersecting:true}]);assert.equal(hero.classList.contains('is-loop-paused'),false);
  assert.equal(hero.dataset.cadernoState,'cycling');
  const background=load({hidden:true});assert.ok(background.document.documentElement.classList.contains('page-hidden'));
});
check('Details click selection is exclusive, repeatable and independent from the hero; initialization stays idempotent',()=>{
  const active=mountBooks(load());const hero=intersectBook(active,'caderno-hero');const details=active.document.getElementById('caderno-detalhes');
  const section=active.document.getElementById('detalhes');
  // O item "Impresso para você" mantém a pose 06 do caderno, mas aparece como 05 na lista e no número grande.
  for(const [code,shown] of [['06','05'],['04','04'],['03','03'],['03','03'],['01','01']]){
    section.querySelector('#detalhe-'+code).click();
    assert.equal(details.dataset.cadernoFeature,code);
    assert.equal(section.querySelectorAll('.detail-trigger[aria-expanded="true"]').length,1);
    assert.equal(section.querySelectorAll('.detail-description[aria-hidden="false"]').length,1);
    assert.equal(section.querySelector('.details-active-number').textContent,shown);
    assert.ok(section.querySelector('.detail-item.is-active').contains(section.querySelector('#detalhe-'+code)));
  }
  assert.equal(hero.dataset.cadernoState,'cycling');assert.equal(active.timers.size,0);
  active.window.Caderninho3D.init();
  assert.equal(active.document.querySelectorAll('.caderno-model').length,4);
  assert.equal(active.window.Caderninho3D.showFeature(details,'07'),false);
  assert.equal(details.dataset.cadernoFeature,'01');
});
check('Reduced motion keeps hero open and details in a static front pose while disclosures remain usable',()=>{
  const calm=mountBooks(load({reduced:true}));
  for(const element of calm.document.querySelectorAll('[data-caderno]')){
    assert.equal(element.dataset.cadernoState,element.id==='caderno-hero'?'open':element.id==='caderno-detalhes'?'interactive':'closed');assert.ok(element.classList.contains('is-still'));
  }
  assert.equal(calm.timers.size,0);
  calm.document.querySelector('#detalhe-04').click();assert.equal(calm.timers.size,0);
  assert.equal(calm.document.querySelector('#detalhe-04').getAttribute('aria-expanded'),'true');
  assert.ok(calm.document.querySelector('#caderno-detalhes').classList.contains('is-still'));
  assert.equal(calm.document.querySelector('#inicio .hero-landscape').hidden,false);
});
check('Enabling reduced motion stops the hero loop and preserves the selected disclosure in static details',()=>{
  const active=mountBooks(load());const hero=intersectBook(active,'caderno-hero');active.document.querySelector('#detalhe-06').click();
  active.media.matches=true;active.media.listeners.forEach(listener=>listener({matches:true}));
  assert.equal(active.timers.size,0);assert.equal(hero.dataset.cadernoState,'open');
  assert.equal(active.document.getElementById('caderno-detalhes').dataset.cadernoState,'interactive');
  assert.ok(active.document.getElementById('caderno-detalhes').classList.contains('is-still'));
  assert.equal(active.document.querySelector('#detalhe-06').getAttribute('aria-expanded'),'true');
  active.advance(3000);assert.equal(hero.dataset.cadernoState,'open');
});
check('Without IntersectionObserver hero cycles, details responds and content remains revealed',()=>{
  const active=load({withObserver:false});active.advance(980);
  assert.equal(active.document.getElementById('caderno-hero').dataset.cadernoState,'cycling');
  assert.equal(active.document.getElementById('caderno-detalhes').dataset.cadernoState,'interactive');
  active.document.querySelector('#detalhe-04').click();
  assert.equal(active.document.getElementById('caderno-detalhes').dataset.cadernoFeature,'04');
  assert.equal(active.document.querySelectorAll('[data-reveal]:not([data-revealed])').length,0);
});
check('Details copy, price, gold CTA and all five accessible disclosure regions match the request',()=>{
  assert.equal($('#detalhes h2').textContent,'Feito com carinho,página por página.');
  assert.equal($('#detalhes h2 em').textContent,'carinho,');
  assert.equal($('#detalhes .section-heading > p'),null);
  assert.deepEqual($$('#detalhes .detail-title').map(el=>el.textContent),['Tamanho A5','Capa com a arte das aulas','Espiral com capa protegida','100 folhas pautadas','Impresso para você']);
  assert.deepEqual($$('#detalhes .detail-description p').map(el=>el.textContent),[
    '14,8 x 21 cm. Cabe na bolsa e na mochila.',
    'Colorida, com acetato transparente que protege do dia a dia.',
    'Espiral que abre totalmente plana. A capa tem uma película de acetato que protege a arte.',
    '100 folhas em papel offset 75 g.',
    'Feito sob encomenda em até 4 dias úteis, com nota fiscal. Entrega no Brasil e no exterior.'
  ]);
  assert.deepEqual($$('#detalhes .detail-number').map(el=>el.textContent),['01','02','03','04','05']);
  assert.ok($('#detalhes .details-scene .details-progresso[aria-hidden="true"] > i'));
  assert.ok($('#detalhes .details-content > .details-purchase'));
  assert.equal(page.document.body.textContent.includes('spiral transparente'),false);
  for(const button of $$('#detalhes .detail-trigger')){
    const region=page.document.getElementById(button.getAttribute('aria-controls'));
    assert.equal(region.getAttribute('aria-labelledby'),button.id);
  }
  assert.equal($('#detalhes [data-caderno-replay]'),null);
  assert.equal($('#detalhes [data-preco]').textContent,'R$ 65,44');
  assert.ok($('#detalhes [data-compra]').matches('.btn.btn-gold.magnetic'));
  assert.equal($('#detalhes .details-hint-desktop').textContent,'PASSE O MOUSE PARA VER');
  assert.equal($('#detalhes .details-hint-touch').textContent,'TOQUE PARA VER');
});
check('Hover, focus and keyboard navigate details; coarse touch does not activate on pointer entry',()=>{
  const active=load({precise:true});
  const doc=active.document;
  const pointer=new active.window.Event('pointerenter');pointer.pointerType='mouse';
  doc.querySelector('#detalhe-02').dispatchEvent(pointer);
  assert.equal(doc.querySelector('#caderno-detalhes').dataset.cadernoFeature,'02');
  doc.querySelector('#detalhe-03').dispatchEvent(new active.window.Event('focus'));
  assert.equal(doc.querySelector('[data-detail-caption]').textContent,'Espiral com capa protegida');
  let focused=null;
  for(const button of doc.querySelectorAll('.detail-trigger'))button.focus=()=>{focused=button.id;};
  const key=(id,key)=>{
    const event=Object.assign(new active.window.Event('keydown',{cancelable:true}),{key});
    doc.getElementById(id).dispatchEvent(event);assert.equal(event.defaultPrevented,true);
  };
  key('detalhe-03','ArrowDown');assert.equal(focused,'detalhe-04');
  assert.equal(doc.querySelector('#caderno-detalhes').dataset.cadernoFeature,'04');
  key('detalhe-04','End');assert.equal(focused,'detalhe-06');
  key('detalhe-06','ArrowDown');assert.equal(focused,'detalhe-01');
  key('detalhe-01','ArrowUp');assert.equal(focused,'detalhe-06');
  key('detalhe-06','Home');assert.equal(focused,'detalhe-01');
  const touch=load();const entry=new touch.window.Event('pointerenter');entry.pointerType='touch';
  touch.document.querySelector('#detalhe-02').dispatchEvent(entry);
  assert.equal(touch.document.querySelector('#caderno-detalhes').dataset.cadernoFeature,'01');
  touch.document.querySelector('#detalhe-02').click();
  assert.equal(touch.document.querySelector('#caderno-detalhes').dataset.cadernoFeature,'02');
});
check('Purchase section combines seven exact answers, portrait postcard, shared price and CTA; obsolete FAQ section is removed',()=>{
  // O antigo FAQ separado foi removido: só existe um grupo de perguntas, dentro de #perguntas.
  assert.equal($$('[data-faq]').length,1);assert.ok($('#perguntas [data-faq]'));
  assert.ok($('#perguntas.section.ds-group.section-cream'));
  assert.deepEqual($$('#perguntas .sec-rule > span').map(el=>el.textContent),['05 / PERGUNTAS','TIRE SUAS DÚVIDAS']);
  assert.equal($('#perguntas-titulo').textContent,'Do clique até a sua casa.');
  assert.equal($('#perguntas-titulo .lettering-transparent').textContent,'casa.');
  assert.deepEqual($$('[data-faq] .detail-title').map(el=>el.textContent),[
    'Como eu compro o caderninho?','Preciso de uma nota fiscal.','Quanto custa?',
    'Quanto tempo demora para chegar?','Vocês enviam para fora do Brasil?',
    'E se eu tiver algum problema com o pedido?'
  ]);
  assert.deepEqual($$('[data-faq] .detail-description p').map(el=>el.textContent),[
    'É simples: clique em "Compre aqui" e finalize o pedido no site do Clube de Autores. O caderno é impresso em até 4 dias úteis, especialmente para você, e enviado para a sua casa.',
    'Você vai receber a sua nota fiscal que será enviada pelo Clube dos Autores, empresa responsável pela impressão e envio do seu caderninho.',
    'R$ 65,44, mais o frete. O frete é calculado na hora da compra, pelo seu CEP ou, fora do Brasil, pelo seu país.',
    'O caderno é impresso em até 4 dias úteis. Depois, o prazo de entrega depende da cidade/país que você escolher.',
    'Sim, você só precisa colocar o seu endereço completo e país de entrega.(Exceções: Em regiões em conflito severo ou com colapso econômico (como Síria e Venezuela) ficam de fora da rede de distribuição.)',
    'Fale com a gente pelo link "Fale com a equipe". Vamos te ajudar a resolver.'
  ]);
  assert.equal($('#compra-resposta-05 .faq-observacao.caption').textContent,"(Exceções: Em regiões em conflito severo ou com colapso econômico (como Síria e Venezuela) ficam de fora da rede de distribuição.)");
  assert.equal($('.purchase-portrait img').getAttribute('src'),'assets/images/marcia.png');
  assert.ok($('.purchase-stamp .mini-flag'));
  assert.equal($('#compra-card-titulo').textContent,'Pronto para ter o seu caderninho?');
  assert.equal($('.purchase-total [data-preco]').textContent,'R$ 65,44');
  assert.ok($('.purchase-postcard [data-compra]').matches('.btn.btn-gold.btn-compra.magnetic'));
  assert.equal($('.purchase-contact').textContent,'Ficou com dúvida? Fale com a equipe');
});
check('Purchase accordion opens one answer at a time, toggles closed, names regions and removes closed links from focus',()=>{
  const active=load({contact:'https://wa.me/5511999999999'});
  const group=active.document.querySelector('[data-faq]');
  const buttons=[...group.querySelectorAll('.detail-trigger')];
  const expanded=()=>buttons.filter(button=>button.getAttribute('aria-expanded')==='true');
  assert.equal(expanded().length,1);assert.equal(expanded()[0].id,'compra-pergunta-01');
  buttons.forEach(button=>{
    assert.equal(button.tagName,'BUTTON');assert.equal(button.type,'button');
    const panel=active.document.getElementById(button.getAttribute('aria-controls'));
    assert.equal(panel.getAttribute('aria-labelledby'),button.id);
    assert.equal(panel.getAttribute('aria-hidden'),String(button!==buttons[0]));
    assert.equal(panel.hasAttribute('inert'),button!==buttons[0]);
  });
  buttons[5].click();assert.equal(expanded().length,1);assert.equal(expanded()[0],buttons[5]);
  assert.equal(group.querySelector('#compra-resposta-06').hasAttribute('inert'),false);
  assert.equal(group.querySelector('#compra-resposta-01').hasAttribute('inert'),true);
  buttons[5].click();assert.equal(expanded().length,0);
  assert.equal(group.querySelector('#compra-resposta-06').hasAttribute('inert'),true);
  for(const index of [2,1,0,5]){buttons[index].click();assert.equal(expanded().length,1);assert.equal(expanded()[0],buttons[index]);}
  assert.equal(active.document.querySelector('#caderno-detalhes').dataset.cadernoFeature,'01');
  for(const options of [{reduced:true},{withObserver:false}]){
    const fallback=load(options);fallback.document.querySelector('#compra-pergunta-04').click();
    assert.ok(fallback.document.querySelector('[data-faq]').classList.contains('disclosure-ready'));
    assert.ok(fallback.document.querySelector('[data-details]').classList.contains('disclosure-ready'));
    assert.equal(fallback.document.querySelector('#compra-pergunta-04').getAttribute('aria-expanded'),'true');
    assert.equal(fallback.document.querySelector('#compra-resposta-01').getAttribute('aria-hidden'),'true');
  }
});
check('Support links share the configured WhatsApp number and message, allow edits, and block placeholders and unsafe URLs',()=>{
  const contacts=$$('[data-contato]');
  assert.equal(contacts.length,4);
  for(const link of contacts){
    const url=new URL(link.getAttribute('href'));
    assert.equal(url.origin,'https://wa.me');
    assert.equal(url.pathname,'/5511936183790');
    assert.equal(url.searchParams.get('text'),"Tenho dúvidas sobre o caderninho, consegue me ajudar?");
    assert.equal(link.getAttribute('aria-disabled'),null);
    assert.equal(link.target,'_blank');
    assert.ok(link.rel.includes('noopener')&&link.rel.includes('noreferrer'));
  }
  assert.ok($('footer .support-button[data-contato]').matches('.btn.btn-primary.btn-lg.magnetic'));
  assert.equal($('footer .support-number').textContent,'+55 11 93618-3790');
  assert.ok($('footer .support-button').textContent.replace(/\s+/g,' ').trim().includes('Tirar dúvidas no WhatsApp'));
  for(const contact of ['https://wa.me/5511999999999','mailto:equipe@example.com']){
    const configured=load({contact,price:'R$ 70,00'});
    for(const link of configured.document.querySelectorAll('[data-contato]')){
      assert.equal(link.getAttribute('href'),contact);assert.equal(link.target,'_blank');
      assert.ok(link.rel.includes('noopener')&&link.rel.includes('noreferrer'));
      assert.equal(link.hasAttribute('aria-disabled'),false);
    }
    assert.equal(configured.document.querySelector('#compra-resposta-03 [data-preco]').textContent,'R$ 70,00');
    assert.equal(configured.document.querySelector('.purchase-total [data-preco]').textContent,'R$ 70,00');
    assert.equal(configured.document.querySelector('.purchase-postcard [data-compra]').getAttribute('href'),'https://clubedeautores.com.br/livro/caderninho-na-mao-prof-marcia-macedo?cart=true');
  }
  for(const options of [{contact:'COLAR_AQUI_O_LINK_DO_WHATSAPP_OU_EMAIL'},{contact:'javascript:alert(1)'},{contact:'data:text/html,test'},{contact:'mailto:'}]){
    const unavailable=load(options);
    for(const link of unavailable.document.querySelectorAll('[data-contato]')){
      assert.equal(link.hasAttribute('href'),false);assert.equal(link.getAttribute('aria-disabled'),'true');
      const event=new unavailable.window.Event('click',{cancelable:true});link.dispatchEvent(event);
      assert.equal(event.defaultPrevented,true);
    }
  }
});
check('Every purchase button reads "Compre aqui" with the arrow and shares the large gold style',()=>{
  const buttons=$$('[data-compra]');assert.equal(buttons.length,9);
  assert.ok(buttons.every(a=>a.textContent.replace(/\s+/g,' ').trim()==='Compre aqui'));
  const content=buttons.filter(a=>!a.classList.contains('purchase-button'));assert.equal(content.length,8);
  assert.ok(content.every(a=>a.matches('.btn.btn-gold.btn-lg.btn-compra.magnetic')&&a.querySelector('.arrow .icon')));
  const css=fs.readFileSync(path.join(project,'assets/pagina.css'),'utf8');
  assert.ok(css.includes('.btn.btn-compra{min-width:min(280px,100%);min-height:64px;padding:18px 32px;gap:16px;font-size:18px;font-weight:700;line-height:1.2;white-space:nowrap;'));
  assert.ok(css.includes('.btn.btn-compra{width:100%;min-width:0;min-height:56px;padding:14px 20px;font-size:18px}'));
});
check('Closing keeps the requested copy and green background, with a closed notebook beside the text and leaf, stamp and pencil around it',()=>{
  assert.ok($('#chamada-final.closing-section.section-dark.section-forest'));
  assert.equal($('#chamada-final .label').textContent,'CADERNINHO NA MÃO. PORTUGUÊS NO CORAÇÃO.');
  assert.equal($('#chamada-final-titulo').textContent,'Tem uma página cheia de carinho esperando por você.');
  assert.equal($('#chamada-final-titulo .lettering-transparent').textContent,'carinho');
  assert.equal($('#chamada-final-titulo em').textContent,'esperando por você.');
  assert.equal($('#chamada-final .lead'),null);
  assert.equal($('#chamada-final .closing-price').textContent,'R$ 65,44 + frete · Envio para o Brasil e para o exterior');
  assert.ok($('#chamada-final [data-compra]').matches('.btn.btn-gold.magnetic'));
  assert.equal($('#chamada-final .closing-heart'),null);
  assert.equal($$('#chamada-final .closing-stage .closing-objeto img').length,3);
  assert.ok($('#chamada-final .closing-grid > .closing-copy h2'));assert.ok($('#chamada-final .closing-stage > #caderno-final[data-caderno-hover]'));
  assert.equal($$('#chamada-final .hero-tropical').length,2);
  assert.ok($('#chamada-final .bloom[data-ds-bloom]'));assert.ok($('#chamada-final .section-ribbon'));
  const closed=$('#caderno-final');assert.equal(closed.hasAttribute('data-caderno-closed'),true);
  assert.equal(closed.dataset.cadernoState,'closed');assert.equal(page.timers.size,0);
  page.window.Caderninho3D.replay('caderno-final');assert.equal(closed.dataset.cadernoState,'closed');
  const calm=mountBooks(load({reduced:true}));assert.equal(calm.document.querySelector('#caderno-final').dataset.cadernoState,'closed');
  assert.ok(calm.document.querySelector('#caderno-final').classList.contains('is-still'));
});
check('Footer keeps the catalogue brand, production credit, external Instagram, return-to-top control and tricolor',()=>{
  const brand=$('footer .brand');
  assert.equal(brand.querySelector('span').childNodes[0].textContent,'marcia macedo');
  assert.equal(brand.querySelector('small').textContent,'PORTUGUÊS COM ALMA BRASILEIRA');
  assert.equal(brand.querySelector('img'),null);
  assert.equal($('footer .footer-credit').textContent,'Caderninho na Mão! · Impresso e enviado pelo Clube de Autores');
  const instagram=$('footer .footer-instagram');
  assert.equal(instagram.textContent,'@portugues_marciamacedo');
  assert.equal(instagram.getAttribute('href'),'https://www.instagram.com/portugues_marciamacedo/');
  assert.equal(instagram.target,'_blank');assert.ok(instagram.rel.includes('noopener')&&instagram.rel.includes('noreferrer'));
  assert.equal($('footer .footer-top').getAttribute('href'),'#inicio');
  assert.equal($$('.footer-tricolor > i').length,3);
});
function mobileBarObserver(active){
  const hero=active.document.getElementById('inicio'),closing=active.document.getElementById('chamada-final');
  const offer=active.document.getElementById('oferta');
  return active.observers.find(observer=>observer.targets.length===3&&[hero,closing,offer].every(el=>observer.targets.includes(el)));
}
function moveBarBoundary(active,key,rect,isIntersecting){
  active.layout[key]=rect;
  const target=active.document.getElementById(key==='hero'?'inicio':'chamada-final');
  mobileBarObserver(active).cb([{target,boundingClientRect:rect,isIntersecting}]);
}
check('Mobile bar appears only after passing the hero, hides at and after closing, and follows reverse scrolling',()=>{
  const active=load();const bar=active.document.querySelector('[data-mobile-purchase]');
  const root=active.document.documentElement;
  assert.equal(bar.hidden,true);assert.ok(bar.hasAttribute('inert'));
  moveBarBoundary(active,'hero',{top:-961,bottom:-1},false);
  assert.equal(bar.hidden,false);assert.equal(bar.getAttribute('aria-hidden'),'false');assert.equal(bar.hasAttribute('inert'),false);
  assert.ok(root.classList.contains('has-mobile-purchase'));assert.equal(root.style.getPropertyValue('--mobile-purchase-space'),'80px');
  moveBarBoundary(active,'closing',{top:843,bottom:1843},true);
  assert.equal(bar.hidden,true);assert.equal(bar.getAttribute('aria-hidden'),'true');assert.ok(bar.hasAttribute('inert'));
  assert.equal(root.classList.contains('has-mobile-purchase'),false);assert.ok(!root.style.getPropertyValue('--mobile-purchase-space'));
  moveBarBoundary(active,'closing',{top:-1100,bottom:-100},false);assert.equal(bar.hidden,true);
  moveBarBoundary(active,'closing',{top:2000,bottom:3000},false);assert.equal(bar.hidden,false);
  moveBarBoundary(active,'hero',{top:-100,bottom:860},true);assert.equal(bar.hidden,true);
  moveBarBoundary(active,'hero',{top:1000,bottom:1960},false);assert.equal(bar.hidden,true);
  // A oferta tem os próprios botões: a barra some enquanto ela está na tela.
  moveBarBoundary(active,'hero',{top:-961,bottom:-1},false);assert.equal(bar.hidden,false);
  const offer=active.document.getElementById('oferta');
  mobileBarObserver(active).cb([{target:offer,isIntersecting:true}]);assert.equal(bar.hidden,true);
  mobileBarObserver(active).cb([{target:offer,isIntersecting:false}]);assert.equal(bar.hidden,false);
});
check('Mobile bar handles restored scrolling, desktop resizing, reduced motion and a no-observer scroll fallback',()=>{
  const middle=()=>({hero:{top:-1200,bottom:-240},closing:{top:2500,bottom:3500}});
  const restored=load({layout:middle()});assert.equal(restored.document.querySelector('[data-mobile-purchase]').hidden,false);
  const desktop=load({mobile:false,layout:middle()});const bar=desktop.document.querySelector('[data-mobile-purchase]');
  assert.equal(bar.hidden,true);
  desktop.mobileMedia.matches=true;desktop.mobileMedia.listeners.forEach(listener=>listener());assert.equal(bar.hidden,false);
  desktop.mobileMedia.matches=false;desktop.mobileMedia.listeners.forEach(listener=>listener());assert.equal(bar.hidden,true);
  const calm=load({reduced:true,layout:middle()});assert.equal(calm.document.querySelector('[data-mobile-purchase]').hidden,false);
  const fallback=load({withObserver:false});const fallbackBar=fallback.document.querySelector('[data-mobile-purchase]');
  assert.equal(fallbackBar.hidden,true);
  fallback.layout.hero={top:-1100,bottom:-140};fallback.window.dispatchEvent(new fallback.window.Event('scroll'));
  assert.equal(fallbackBar.hidden,false);
  fallback.layout.closing={top:800,bottom:1800};fallback.window.dispatchEvent(new fallback.window.Event('scroll'));
  assert.equal(fallbackBar.hidden,true);
  fallback.layout.closing={top:3000,bottom:4000};fallback.window.dispatchEvent(new fallback.window.Event('pageshow'));
  assert.equal(fallbackBar.hidden,false);
  fallback.layout.hero={top:0,bottom:960};fallback.window.dispatchEvent(new fallback.window.Event('resize'));
  assert.equal(fallbackBar.hidden,true);
});
check('Mobile bar shares price and checkout, supports iPhone viewport fit and transfers active focus to the final CTA before hiding',()=>{
  const active=load({price:'R$ 70,00',layout:{hero:{top:-1200,bottom:-240},closing:{top:2500,bottom:3500}}});
  const bar=active.document.querySelector('[data-mobile-purchase]'),button=bar.querySelector('[data-compra]');
  assert.equal(bar.querySelector('[data-preco]').textContent,'R$ 70,00');
  assert.equal(button.textContent.trim(),'Compre aqui');
  assert.equal(button.getAttribute('href'),'https://clubedeautores.com.br/livro/caderninho-na-mao-prof-marcia-macedo?cart=true');
  assert.equal(button.hasAttribute('target'),false);
  assert.ok(active.document.querySelector('meta[name="viewport"]').getAttribute('content').includes('viewport-fit=cover'));
  active.document.activeElement=button;
  const finalButton=active.document.querySelector('#chamada-final [data-compra]');let focused=false;
  finalButton.focus=options=>{focused=options.preventScroll===true;active.document.activeElement=finalButton;};
  moveBarBoundary(active,'closing',{top:820,bottom:1820},true);
  assert.equal(focused,true);assert.equal(bar.hidden,true);assert.equal(active.document.activeElement,finalButton);
});
const output=report.join('\n')+'\n\n'+report.length+' sales-page checks passed.\nDOM, pointer, timer and viewport APIs are simulated: 3D rendering, page typography, native gestures, mobile composition and live checkout were not verified in a browser.\n';
fs.writeFileSync(path.join(__dirname,'sales-verification.txt'),output);
console.log(output);
