/* Sales hero and shared-runtime regression checks. No browser rendering. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {parseHTML} = require('./runtime/node_modules/linkedom');
const project = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(project, 'index.html'), 'utf8');
const runtime = fs.readFileSync(path.join(project, 'assets/design_system.js'), 'utf8');
const ids = ['inicio','a-frase','para-que','detalhes','como-comprar','perguntas','chamada-final'];
const report = [];
const check = (label, action) => { action(); report.push(`PASS ${label}`); };

function load({link, price, reduced=false, extraButton=false}={}) {
  const {document, window} = parseHTML(source);
  const observers=[];
  class Observer { constructor(cb) { this.cb=cb;this.targets=[];observers.push(this); } observe(el) { this.targets.push(el); } unobserve() {} disconnect() {} }
  window.IntersectionObserver=Observer;
  const media={matches:reduced,listeners:[],addEventListener(type,listener) { if(type==='change')this.listeners.push(listener); }};
  const matchMedia=q=>q.includes('pointer:fine')?{matches:false}:media;
  window.matchMedia=matchMedia;
  const playback={play:0,pause:0,load:0};
  const video=document.getElementById('caderno-video');
  video.play=()=>{playback.play++;return Promise.resolve();};
  video.pause=()=>{playback.pause++;};
  video.load=()=>{playback.load++;};
  const context=vm.createContext({document,window,URL,HTMLElement:window.HTMLElement,
    navigator:{},IntersectionObserver:Observer,matchMedia,
    requestAnimationFrame:cb=>cb(),addEventListener:window.addEventListener.bind(window),
    innerWidth:390,innerHeight:844,scrollY:0,setTimeout:()=>1,clearTimeout() {},console});
  vm.runInContext(runtime,context,{filename:'design_system.js'});
  if(extraButton)document.querySelector('footer').insertAdjacentHTML('beforeend','<a data-compra><span data-preco></span></a>');
  let config=[...document.querySelectorAll('script:not([src])')][0].textContent;
  if(link)config=config.replace(/const LINK_COMPRA = "[^"]+";/,`const LINK_COMPRA = ${JSON.stringify(link)};`);
  if(price)config=config.replace('R$ 65,44',price);
  vm.runInContext(config,context,{filename:'index.html:purchase-config'});
  return {document,window,observers,media,playback};
}
const page=load();
const $=selector=>page.document.querySelector(selector);
const $$=selector=>[...page.document.querySelectorAll(selector)];

check('Seven sections remain in order; the six sections after the hero are still placeholders',()=>{
  const sections=$$('main > section');
  assert.deepEqual(sections.map(el=>el.id),ids);
  sections.forEach(section=>{
    const title=page.document.getElementById(section.getAttribute('aria-labelledby'));
    assert.ok(title?.matches('h1,h2'));
    if(section.id!=='inicio'){
      assert.equal(section.querySelectorAll('p,a,button,article,form').length,0);
      assert.equal(section.querySelectorAll('[data-reveal]').length,1);
    }
  });
  assert.equal($$('h1').length,1);
  assert.equal(page.document.title,'Caderninho na Mão! · Profa. Marcia Macedo');
});
check('Hero copy, lowercase transparent lettering, Brazilian flag and purchase label match the request',()=>{
  assert.equal($('#inicio .hero-discord-pill').textContent,'O caderno oficial das aulas da Profa. Marcia Macedo');
  assert.ok($('#inicio .mini-flag'));
  assert.equal($('#inicio-titulo').childNodes[0].textContent,'Caderninho');
  assert.ok($('#inicio-titulo > br'));
  assert.equal($('#inicio-titulo .lettering-transparent').textContent,'na mão!');
  assert.equal($('#inicio .lead').textContent,'Para anotar cada palavra nova, praticar a escrita e revisar o seu português. Com a arte das aulas, espiral e 100 folhas.');
  assert.equal($('#inicio a[data-compra]').textContent,'Quero o meu caderninho');
  assert.equal($('.hero-purchase-note').textContent,'R$ 65,44 · endereços no Brasil');
});
check('Shared CSS, JS, fonts and image paths resolve from the root',()=>{
  assert.ok($('link[href="assets/design_system.css"]'));
  assert.ok($('link[href="assets/pagina.css"]'));
  assert.ok($('script[src="assets/design_system.js"]'));
  for(const el of $$('link[href],img[src],script[src]')){
    const ref=el.getAttribute('href')||el.getAttribute('src');
    assert.ok(fs.existsSync(path.join(project,ref)),ref);
  }
  const css=fs.readFileSync(path.join(project,'assets/pagina.css'),'utf8');
  for(const [,ref] of css.matchAll(/url\("([^"\n]+)"\)/g))assert.ok(fs.existsSync(path.join(project,'assets',ref)),ref);
  assert.ok(fs.existsSync(path.join(project,$('video').getAttribute('poster'))));
  assert.ok(fs.existsSync(path.join(project,$('video source').dataset.src)));
});
check('Only brand and purchase action in the header; requested footer and shared tricolor',()=>{
  const header=$('header .nav-inner');
  assert.equal(header.children.length,2);
  assert.ok(header.children[0].classList.contains('brand'));
  assert.ok(header.children[1].hasAttribute('data-compra'));
  assert.ok($('footer').textContent.includes('Profa. Marcia Macedo · @portugues_marciamacedo'));
  assert.equal($$('.footer-tricolor > i').length,3);
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
check('Reduced motion shows only the opened notebook, without assigning or playing the MP4',()=>{
  const calm=load({reduced:true});
  assert.ok(calm.document.documentElement.classList.contains('motion-paused'));
  assert.equal(calm.document.querySelectorAll('[data-reveal]:not([data-revealed])').length,0);
  assert.equal(calm.document.getElementById('caderno-video').hidden,true);
  assert.equal(calm.document.getElementById('caderno-aberto').hidden,false);
  assert.equal(calm.document.querySelector('video source').hasAttribute('src'),false);
  assert.equal(calm.playback.play,0);
  assert.equal(calm.playback.load,0);
});
check('Normal playback starts muted/inline with a first-frame poster, no controls and no loop',()=>{
  const video=$('video');
  assert.ok(video.hasAttribute('autoplay')&&video.hasAttribute('muted')&&video.hasAttribute('playsinline'));
  assert.equal(video.hasAttribute('controls'),false);
  assert.equal(video.hasAttribute('loop'),false);
  assert.equal(video.loop,false);
  assert.equal(video.muted,true);
  assert.equal(video.hidden,false);
  assert.equal($('#caderno-aberto').hidden,true);
  assert.equal(video.getAttribute('poster'),'assets/images/caderno-primeiro-quadro.jpg');
  assert.equal(page.playback.play,1);
  assert.equal(page.playback.load,1);
});
check('Ending holds the open notebook image and never restarts the finished video',()=>{
  $('video').dispatchEvent(new page.window.Event('ended'));
  assert.equal($('video').hidden,true);
  assert.equal($('#caderno-aberto').hidden,false);
  page.media.listeners.forEach(listener=>listener({matches:false}));
  assert.equal(page.playback.play,1);
});
check('Enabling reduced motion during playback stops and unloads the MP4',()=>{
  const active=load();active.media.matches=true;
  active.media.listeners.forEach(listener=>listener({matches:true}));
  assert.equal(active.document.getElementById('caderno-video').hidden,true);
  assert.equal(active.document.getElementById('caderno-aberto').hidden,false);
  assert.equal(active.document.querySelector('video source').hasAttribute('src'),false);
  assert.ok(active.playback.pause>0);
});
const output=`${report.join('\n')}\n\n${report.length} sales-page checks passed.\nMedia APIs are simulated: native autoplay/rendering and the live checkout destination were not verified in a browser.\n`;
fs.writeFileSync(path.join(__dirname,'sales-verification.txt'),output);
console.log(output);
