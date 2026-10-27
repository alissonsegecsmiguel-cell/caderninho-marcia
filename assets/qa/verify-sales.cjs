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
const ids = ['inicio','a-frase','para-que','detalhes','como-comprar','perguntas','chamada-final'];
const report = [];
const check = (label, action) => { action(); report.push(`PASS ${label}`); };

function load({link, price, reduced=false, precise=false, extraButton=false, withObserver=true}={}) {
  const {document, window} = parseHTML(source);
  const observers=[];
  class Observer { constructor(cb) { this.cb=cb;this.targets=[];observers.push(this); } observe(el) { this.targets.push(el); } unobserve() {} disconnect() {} }
  if(withObserver)window.IntersectionObserver=Observer;
  else delete window.IntersectionObserver;
  const media={matches:reduced,listeners:[],addEventListener(type,listener) { if(type==='change')this.listeners.push(listener); }};
  const matchMedia=q=>q.includes('pointer:fine')?{matches:precise}:media;
  window.matchMedia=matchMedia;
  const timers=new Map();let now=0,nextTimer=0;
  const advance=ms=>{const end=now+ms;for(let steps=0;steps<1000;steps++){
    const next=[...timers.entries()].filter(([,timer])=>timer.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];
    if(!next)break;timers.delete(next[0]);now=next[1].time;next[1].callback();
  }now=end;};
  const context=vm.createContext({document,window,URL,HTMLElement:window.HTMLElement,
    navigator:{},IntersectionObserver:Observer,matchMedia,
    requestAnimationFrame:cb=>cb(),addEventListener:window.addEventListener.bind(window),
    innerWidth:390,innerHeight:844,scrollY:0,
    setTimeout:(callback,delay=0)=>{const id=++nextTimer;timers.set(id,{callback,time:now+delay});return id;},
    clearTimeout:id=>timers.delete(id),console});
  vm.runInContext(runtime,context,{filename:'design_system.js'});
  if(extraButton)document.querySelector('footer').insertAdjacentHTML('beforeend','<a data-compra><span data-preco></span></a>');
  let config=[...document.querySelectorAll('script:not([src])')][0].textContent;
  if(link)config=config.replace(/const LINK_COMPRA = "[^"]+";/,`const LINK_COMPRA = ${JSON.stringify(link)};`);
  if(price)config=config.replace('R$ 65,44',price);
  vm.runInContext(config,context,{filename:'index.html:purchase-config'});
  vm.runInContext(notebookRuntime,context,{filename:'pagina.js'});
  return {document,window,observers,media,advance,timers};
}
const page=load();
const $=selector=>page.document.querySelector(selector);
const $$=selector=>[...page.document.querySelectorAll(selector)];

check('Seven sections remain in order; four future sections remain placeholders',()=>{
  const sections=$$('main > section');
  assert.deepEqual(sections.map(el=>el.id),ids);
  sections.forEach(section=>{
    const title=page.document.getElementById(section.getAttribute('aria-labelledby'));
    assert.ok(title?.matches('h1,h2'));
    if(!['inicio','a-frase','detalhes'].includes(section.id)){
      assert.equal(section.querySelectorAll('p,a,button,article,form').length,0);
      assert.equal(section.querySelectorAll('[data-reveal]').length,1);
    }
  });
  assert.equal($$('h1').length,1);
  assert.equal(page.document.title,'Caderninho na Mão! · Profa. Marcia Macedo');
});
check('A-frase reuses the green identity layout, exact copy, watercolor details and full cover',()=>{
  assert.ok($('#a-frase.section.ds-group.section-dark.section-forest'));
  assert.deepEqual($$('#a-frase .sec-rule span').map(el=>el.textContent),['02 / A FRASE','DE ONDE VEM O NOME']);
  assert.equal($('#a-frase h2').textContent,'Uma frase que virou caderno.');
  assert.equal($('#a-frase h2 .lettering-transparent').textContent,'frase');
  assert.equal($('#a-frase h2 em').textContent,'caderno.');
  assert.equal($('#a-frase .section-heading > p').textContent,'Em toda aula, a Profa. Marcia repete: "caderninho na mão!". É escrevendo que a palavra nova fica com você. Agora, o caderninho das aulas existe de verdade.');
  assert.equal($('#a-frase .identity-grid').children.length,3);
  assert.equal($('#a-frase .identity-manifesto .label').textContent,'UMA PALAVRA DA PROFESSORA');
  assert.equal($('#a-frase .identity-manifesto p').innerHTML,'Quem anota, lembra.<br>Quem lembra, usa.<br><em>E quem usa, aprende de verdade.</em>');
  assert.equal($('#a-frase .manifesto-foot span').textContent,'Profa. Marcia Macedo');
  assert.equal($('#a-frase .manifesto-foot use').getAttribute('href'),'#i-book');
  assert.equal($('#a-frase .flag-art.ds-window[data-reveal="scale"] img').getAttribute('src'),'assets/images/brasil-aquarela.png');
  assert.equal($('#a-frase .coord').textContent,'RIO DE JANEIRO · 22°57′ S 43°09′ W');
  assert.equal($('#a-frase .window-caption').textContent,'A FRASE DE TODA AULA.');
  const ring=$('#a-frase .postmark textPath').getAttribute('href').slice(1);
  assert.ok(page.document.getElementById(ring));
  assert.equal($('#a-frase .notebook[data-reveal] img').getAttribute('src'),'assets/images/capa.jpg');
  assert.deepEqual($$('#a-frase .principles > div').map(el=>el.textContent),[
    '01.Nasceu na sala de aula: a frase que a professora repete em toda aula.',
    '02.Feito para os alunos: com a arte e a identidade das aulas.',
    '03.Para usar todo dia: na aula, nos estudos, onde você estiver.'
  ]);
  assert.equal($$('#a-frase [data-reveal]').length,6);
});
check('Hero copy, lowercase transparent lettering, Brazilian flag and purchase label match the request',()=>{
  assert.equal($('#inicio .hero-discord-pill').textContent,'O caderno oficial das aulas da Profa. Marcia Macedo');
  assert.ok($('#inicio .mini-flag'));
  assert.equal($('#inicio-titulo').childNodes[0].textContent,'Caderninho');
  assert.ok($('#inicio-titulo > br'));
  assert.equal($('#inicio-titulo .lettering-transparent').textContent,'na mão!');
  assert.equal($('#inicio .lead').textContent,'Para anotar cada palavra nova, praticar a escrita e revisar o seu português. Com a arte das aulas, espiral e 100 folhas.');
  assert.equal($('#inicio a[data-compra]').textContent,'Quero o meu caderninho');
  assert.equal($('.hero-purchase-note').textContent,'R$ 65,44 + frete · Envio para endereços no Brasil');
});
check('Hero retains catalogue composition with Rio behind the notebook, decorative flag, leaves and a continuous word strip',()=>{
  const reference=parseHTML(fs.readFileSync(path.join(project,'assets/design_system.html'),'utf8')).document;
  for(const selector of ['.hero','.hero-glow.bloom[data-ds-bloom]','.hero-grid','.hero-copy','.hero-discord-pill','.display','.lettering-transparent','.lead','.hero-actions','.hero-art','.postmark','.handwritten','.art-caption','.annot.coord','.hero-bottom']){
    const original=reference.querySelector('#inicio '+selector)||reference.querySelector(selector);
    const actual=$('#inicio '+selector)||$(selector);
    assert.ok(actual,selector);
    for(const className of original.classList)assert.ok(actual.classList.contains(className),selector+' '+className);
  }
  assert.equal($('#inicio .hero-art .ds-window'),null);
  const landscape=$('#inicio .hero-art > img.landscape');
  assert.equal(landscape.getAttribute('src'),'assets/images/brasil-aquarela.png');
  assert.ok($('#inicio .hero-art > .caderno-3d[data-caderno]'));
  assert.ok(landscape.nextElementSibling.classList.contains('caderno-3d'));
  assert.equal($$('#inicio .hero-copy .hero-flag[aria-hidden="true"] .flag-wash').length,2);
  assert.ok($('#inicio .hero-flag .flag-orb'));
  assert.equal($$('#inicio img.hero-tropical[aria-hidden="true"][alt=""]').length,2);
  assert.equal($('#inicio .handwritten').childNodes[0].textContent,'Caderninho na mão!');
  assert.ok($('#inicio .hero-actions .btn.btn-primary.magnetic .arrow .icon'));
  assert.equal($$('#inicio .side-rail[aria-hidden="true"]').length,2);
  assert.equal($('#inicio').nextElementSibling.className,'wire');
  assert.deepEqual($$('.wire-track > span').map(el=>el.textContent),Array(2).fill('Anote ✳ Pratique ✳ Revise ✳ Caderninho na mão ✳ Feito para os alunos da Profa. Marcia ✳'));
  assert.equal($('.wire-track > span:last-child').getAttribute('aria-hidden'),'true');
  const ids=$$('[id]').map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
  for(const el of $$('textPath[href^="#"]'))assert.ok(page.document.getElementById(el.getAttribute('href').slice(1)));
  const heroReveal=$$('#inicio [data-reveal]');
  assert.deepEqual(heroReveal.map(el=>el.style.getPropertyValue('--reveal-delay')),['0ms','80ms','160ms','240ms','320ms','400ms','480ms']);
});
check('Shared CSS, JS, fonts and image paths resolve from the root',()=>{
  assert.ok($('link[href="assets/design_system.css"]'));
  assert.ok($('link[href="assets/pagina.css"]'));
  assert.ok($('script[src="assets/design_system.js"]'));
  assert.ok($('script[src="assets/pagina.js"]'));
  for(const el of $$('link[href],img[src],script[src]')){
    const ref=el.getAttribute('href')||el.getAttribute('src');
    assert.ok(fs.existsSync(path.join(project,ref)),ref);
  }
  for(const stylesheet of $$('link[rel="stylesheet"]')){
    const file=path.join(project,stylesheet.getAttribute('href'));
    for(const [,ref] of fs.readFileSync(file,'utf8').matchAll(/url\("([^"\n]+)"\)/g)){
      if(!ref.startsWith('data:'))assert.ok(fs.existsSync(path.resolve(path.dirname(file),ref)),ref);
    }
  }
  assert.equal($$('video, source').length,0);
  assert.equal(source.includes('caderno-abrindo.mp4'),false);
});
check('Only brand and purchase action in the header; requested footer and shared tricolor',()=>{
  const header=$('header .nav-inner');
  assert.equal(header.children.length,2);
  assert.ok(header.children[0].classList.contains('brand'));
  assert.equal(header.children[0].textContent.trim(),'marcia macedo');
  assert.equal(header.querySelector('.brand img'),null);
  assert.ok(header.children[1].hasAttribute('data-compra'));
  assert.equal(header.querySelector('[data-preco]').textContent,'R$ 65,44');
  assert.ok($('footer').textContent.includes('Profa. Marcia Macedo · @portugues_marciamacedo'));
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
  assert.equal($$('.section-ribbon').length,7);
  assert.equal($$('.section-leaf').length,6);
  assert.equal($$('.svg-sprite').length,1);
  for(const el of $$('use[href^="#"]'))assert.ok(page.document.getElementById(el.getAttribute('href').slice(1)));
  const observer=page.observers[0];observer.cb(observer.targets.map(target=>({target,isIntersecting:true})));
  assert.equal($$('[data-reveal]:not([data-revealed])').length,0);
  page.document.dispatchEvent(Object.assign(new page.window.Event('keydown'),{key:'Escape'}));
});
check('All purchase links use the configured Clube de Autores destination and editable price',()=>{
  assert.equal($('[data-preco]').textContent,'R$ 65,44');
  for(const button of $$('[data-compra]')){
    assert.equal(button.getAttribute('href'),'https://clubedeautores.com.br/livro/caderninho-na-mao-prof-marcia-macedo');
    assert.equal(button.target,'_blank');
    assert.ok(button.rel.includes('noopener')&&button.rel.includes('noreferrer'));
    assert.equal(button.hasAttribute('aria-disabled'),false);
    assert.ok(button.getAttribute('aria-label').includes('R$ 65,44'));
  }
  const unconfigured=load({link:'COLAR_AQUI_O_LINK_DO_CLUBE_DE_AUTORES'});
  const button=unconfigured.document.querySelector('[data-compra]');
  const event=new unconfigured.window.Event('click',{bubbles:true,cancelable:true});button.dispatchEvent(event);
  assert.equal(event.defaultPrevented,true);
});
check('Configured URL and changed price apply to all purchase buttons, in new tabs',()=>{
  const configured=load({link:'https://example.com/caderninho',price:'R$ 70,00',extraButton:true});
  for(const button of configured.document.querySelectorAll('[data-compra]')){
    assert.equal(button.getAttribute('href'),'https://example.com/caderninho');
    assert.equal(button.target,'_blank');
    assert.ok(button.rel.includes('noopener')&&button.rel.includes('noreferrer'));
    assert.ok(button.getAttribute('aria-label').includes('R$ 70,00'));
    const event=new configured.window.Event('click',{bubbles:true,cancelable:true});button.dispatchEvent(event);
    assert.equal(event.defaultPrevented,false);
  }
  for(const element of configured.document.querySelectorAll('[data-preco]'))assert.equal(element.textContent,'R$ 70,00');
});
function intersectBook(loaded,id){
  const element=loaded.document.getElementById(id);
  const observer=loaded.observers.find(item=>item.targets.includes(element));
  assert.ok(observer);observer.cb([{target:element,isIntersecting:true}]);return element;
}
check('One shared 3D template mounts in hero and details with the real cover and inner page',()=>{
  assert.equal($$('[data-caderno]').length,2);
  for(const element of $$('[data-caderno]')){
    assert.equal(element.getAttribute('role'),'img');assert.ok(element.getAttribute('aria-label'));
    assert.equal(element.querySelectorAll('.caderno-model').length,1);
    assert.equal(element.querySelector('.caderno-page img').getAttribute('src'),'assets/images/miolo.png');
    assert.equal(element.querySelector('.caderno-cover-front img').getAttribute('src'),'assets/images/capa.jpg');
    assert.equal(element.querySelector('[data-caderno-back]').hidden,true);
    assert.equal(element.querySelector('.caderno-fallback').hidden,true);
  }
});
check('Each notebook opens once after its own viewport entry and approximately one second',()=>{
  const active=load();const hero=intersectBook(active,'caderno-hero');
  const details=active.document.getElementById('caderno-detalhes');
  assert.equal(hero.dataset.cadernoState,'entering');assert.equal(details.dataset.cadernoState,'closed');
  active.advance(979);assert.equal(hero.dataset.cadernoState,'entering');
  active.advance(1);assert.equal(hero.dataset.cadernoState,'open');assert.equal(details.dataset.cadernoState,'closed');
  intersectBook(active,'caderno-detalhes');active.advance(980);assert.equal(details.dataset.cadernoState,'open');
  active.advance(30000);assert.equal(hero.dataset.cadernoState,'open');assert.equal(details.dataset.cadernoState,'open');
});
check('Details replay is independent, repeatable and initialization is idempotent',()=>{
  const active=load();const hero=intersectBook(active,'caderno-hero');const details=intersectBook(active,'caderno-detalhes');
  active.advance(980);const button=active.document.querySelector('[data-caderno-replay]');
  button.click();button.click();assert.equal(details.dataset.cadernoState,'entering');assert.equal(hero.dataset.cadernoState,'open');
  assert.equal(active.timers.size,1);active.advance(980);assert.equal(details.dataset.cadernoState,'open');
  active.window.Caderninho3D.init();
  assert.equal(active.document.querySelectorAll('.caderno-model').length,2);
});
check('Reduced motion mounts both notebooks already open, with no pending opening timer',()=>{
  const calm=load({reduced:true});
  for(const element of calm.document.querySelectorAll('[data-caderno]')){
    assert.equal(element.dataset.cadernoState,'open');assert.ok(element.classList.contains('is-still'));
  }
  assert.equal(calm.timers.size,0);
  calm.document.querySelector('[data-caderno-replay]').click();assert.equal(calm.timers.size,0);
  assert.equal(calm.document.querySelector('#inicio .hero-landscape').hidden,false);
});
check('Enabling reduced motion cancels opening timers and settles every notebook open',()=>{
  const active=load();const hero=intersectBook(active,'caderno-hero');active.advance(300);
  active.media.matches=true;active.media.listeners.forEach(listener=>listener({matches:true}));
  assert.equal(active.timers.size,0);assert.equal(hero.dataset.cadernoState,'open');
  assert.equal(active.document.getElementById('caderno-detalhes').dataset.cadernoState,'open');
  active.advance(3000);assert.equal(hero.dataset.cadernoState,'open');
});
check('Without IntersectionObserver notebooks still open and content remains revealed',()=>{
  const active=load({withObserver:false});active.advance(980);
  for(const element of active.document.querySelectorAll('[data-caderno]'))assert.equal(element.dataset.cadernoState,'open');
  assert.equal(active.document.querySelectorAll('[data-reveal]:not([data-revealed])').length,0);
});
const output=report.join('\n')+'\n\n'+report.length+' sales-page checks passed.\nDOM, timers and viewport APIs are simulated: CSS 3D rendering, mobile composition and live checkout were not verified in a browser.\n';
fs.writeFileSync(path.join(__dirname,'sales-verification.txt'),output);
console.log(output);
