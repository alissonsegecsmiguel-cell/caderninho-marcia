/* Sales scaffold and shared-runtime regression checks. No browser rendering. */
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
  const media={matches:reduced,addEventListener() {}};
  const context=vm.createContext({document,window,URL,HTMLElement:window.HTMLElement,
    navigator:{},IntersectionObserver:Observer,matchMedia:q=>q.includes('pointer:fine')?{matches:false}:media,
    requestAnimationFrame:cb=>cb(),addEventListener:window.addEventListener.bind(window),
    innerWidth:390,innerHeight:844,scrollY:0,setTimeout:()=>1,clearTimeout() {},console});
  vm.runInContext(runtime,context,{filename:'design_system.js'});
  if(extraButton)document.querySelector('footer').insertAdjacentHTML('beforeend','<a data-compra><span data-preco></span></a>');
  let config=[...document.querySelectorAll('script:not([src])')][0].textContent;
  if(link)config=config.replace('COLAR_AQUI_O_LINK_DO_CLUBE_DE_AUTORES',link);
  if(price)config=config.replace('R$ 65,44',price);
  vm.runInContext(config,context,{filename:'index.html:purchase-config'});
  return {document,window,observers};
}
const page=load();
const $=selector=>page.document.querySelector(selector);
const $$=selector=>[...page.document.querySelectorAll(selector)];

check('Exactly seven empty sections in the requested order, with accessible titles',()=>{
  const sections=$$('main > section');
  assert.deepEqual(sections.map(el=>el.id),ids);
  sections.forEach(section=>{
    const title=page.document.getElementById(section.getAttribute('aria-labelledby'));
    assert.ok(title?.matches('h1,h2'));
    assert.equal(section.querySelectorAll('p,a,button,article,form').length,0);
    assert.equal(section.querySelectorAll('[data-reveal]').length,1);
  });
  assert.equal($$('h1').length,1);
  assert.equal(page.document.title,'Caderninho na Mão! · Profa. Marcia Macedo');
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
check('Editable price is rendered; placeholder cannot navigate to an invalid checkout',()=>{
  const button=$('[data-compra]');
  assert.equal($('[data-preco]').textContent,'R$ 65,44');
  assert.equal(button.getAttribute('aria-disabled'),'true');
  const event=new page.window.Event('click',{bubbles:true,cancelable:true});button.dispatchEvent(event);
  assert.equal(event.defaultPrevented,true);
});
check('Configured URL and changed price apply to all purchase buttons, in new tabs',()=>{
  const configured=load({link:'https://example.com/caderninho',price:'R$ 70,00',extraButton:true});
  for(const button of configured.document.querySelectorAll('[data-compra]')){
    assert.equal(button.getAttribute('href'),'https://example.com/caderninho');
    assert.equal(button.target,'_blank');
    assert.ok(button.rel.includes('noopener')&&button.rel.includes('noreferrer'));
    assert.ok(button.getAttribute('aria-label').includes('R$ 70,00'));
    assert.equal(button.querySelector('[data-preco]').textContent,'R$ 70,00');
    const event=new configured.window.Event('click',{bubbles:true,cancelable:true});button.dispatchEvent(event);
    assert.equal(event.defaultPrevented,false);
  }
});
check('Reduced-motion preference works without the catalogue pause button',()=>{
  const calm=load({reduced:true});
  assert.ok(calm.document.documentElement.classList.contains('motion-paused'));
  assert.equal(calm.document.querySelectorAll('[data-reveal]:not([data-revealed])').length,0);
});
const output=`${report.join('\n')}\n\n${report.length} sales-page checks passed.\nBrowser rendering and the real Clube de Autores destination were not verified; the purchase link remains a placeholder.\n`;
fs.writeFileSync(path.join(__dirname,'sales-verification.txt'),output);
console.log(output);
